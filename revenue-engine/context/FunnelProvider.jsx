import React, { createContext, useContext } from 'react';
import { useFunnelState } from '../hooks/useFunnelState';
import { subscribeToMetricUpdates, disconnectMetricsSocket } from '../services/metricsService';
import { triggerPipeline } from '../services/webhookService';

/**
 * FunnelContext
 * 
 * Global state management for the entire funnel architecture system.
 * Provides access to nodes, edges, metrics, and CI/CD integration.
 */
const FunnelContext = createContext(null);

/**
 * FunnelProvider
 * 
 * Wraps the funnel components and provides global state access.
 * Manages lifecycle hooks, metric subscriptions, and webhook integration.
 */
export const FunnelProvider = ({
  children,
  initialNodes = [],
  initialEdges = [],
  onStateChange = null,
  autoSync = true,
  metricsInterval = 5000,
}) => {
  const funnelState = useFunnelState(initialNodes, initialEdges);
  const unsubscribersRef = React.useRef([]);

  // Subscribe to metric updates on mount
  React.useEffect(() => {
    if (autoSync) {
      funnelState.nodes.forEach((node) => {
        const unsubscribe = subscribeToMetricUpdates(node.id, (metrics) => {
          funnelState.updateNode(node.id, { metrics });
        });
        unsubscribersRef.current.push(unsubscribe);
      });
    }

    return () => {
      // Cleanup subscriptions
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      disconnectMetricsSocket();
    };
  }, [autoSync, funnelState.nodes.length]);

  // Notify parent of state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange({
        nodes: funnelState.nodes,
        edges: funnelState.edges,
        timestamp: new Date().toISOString(),
      });
    }
  }, [funnelState.nodes, funnelState.edges]);

  // Enhanced funnel state with additional methods
  const value = {
    ...funnelState,
    // Trigger report generation
    generateReport: async (options = {}) => {
      return await triggerPipeline(
        {
          nodes: funnelState.nodes,
          edges: funnelState.edges,
        },
        options
      );
    },
    // Get node by ID
    getNode: (id) => funnelState.nodes.find((n) => n.id === id),
    // Get edge by ID
    getEdge: (id) => funnelState.edges.find((e) => e.id === id),
    // Get connected nodes
    getConnectedNodes: (nodeId) => {
      const edgesForNode = funnelState.edges.filter(
        (e) => e.source === nodeId || e.target === nodeId
      );
      return edgesForNode.flatMap((e) => [
        funnelState.nodes.find((n) => n.id === e.source),
        funnelState.nodes.find((n) => n.id === e.target),
      ]);
    },
    // Clear all nodes and edges
    clear: () => {
      funnelState.nodes.forEach((node) => funnelState.deleteNode(node.id));
    },
  };

  return (
    <FunnelContext.Provider value={value}>
      {children}
    </FunnelContext.Provider>
  );
};

/**
 * useFunnelContext
 * 
 * Hook to access funnel context from any child component
 */
export const useFunnelContext = () => {
  const context = useContext(FunnelContext);
  if (!context) {
    throw new Error('useFunnelContext must be used within FunnelProvider');
  }
  return context;
};
