/**
 * metricsService
 * 
 * Handles real-time metric data integration from analytics backends.
 * Supports polling and WebSocket subscriptions for live updates.
 */

const METRICS_API_BASE = process.env.REACT_APP_METRICS_API || 'http://localhost:3001/api/metrics';
const WS_URL = process.env.REACT_APP_METRICS_WS || 'ws://localhost:3001/metrics';

let wsConnection = null;
const subscribers = new Map(); // nodeId -> [callbacks]
const metricsCache = new Map(); // nodeId -> cached metrics

/**
 * Fetch metrics for a single node from the analytics backend
 */
export const fetchNodeMetrics = async (nodeId) => {
  try {
    const cached = metricsCache.get(nodeId);
    // Return cache if fresh (< 5 seconds old)
    if (cached && Date.now() - cached.fetchedAt < 5000) {
      return cached.data;
    }

    const response = await fetch(`${METRICS_API_BASE}/node/${nodeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_METRICS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Metrics API error: ${response.statusText}`);
    }

    const metrics = await response.json();
    
    // Cache the result
    metricsCache.set(nodeId, {
      data: metrics,
      fetchedAt: Date.now(),
    });

    return metrics;
  } catch (error) {
    console.error(`Failed to fetch metrics for node ${nodeId}:`, error);
    // Return cached data even if stale, or empty metrics
    const cached = metricsCache.get(nodeId);
    return cached?.data || {};
  }
};

/**
 * Fetch metrics for multiple nodes in parallel
 */
export const fetchBatchMetrics = async (nodeIds) => {
  try {
    const promises = nodeIds.map((id) => fetchNodeMetrics(id));
    const results = await Promise.all(promises);
    return Object.fromEntries(
      nodeIds.map((id, idx) => [id, results[idx]])
    );
  } catch (error) {
    console.error('Failed to fetch batch metrics:', error);
    return {};
  }
};

/**
 * Subscribe to real-time metric updates via WebSocket
 */
export const subscribeToMetricUpdates = (nodeId, callback) => {
  // Initialize WebSocket connection if not exists
  if (!wsConnection) {
    initWebSocketConnection();
  }

  // Add callback to subscribers
  if (!subscribers.has(nodeId)) {
    subscribers.set(nodeId, []);
  }
  subscribers.get(nodeId).push(callback);

  // Send subscription message
  if (wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(
      JSON.stringify({
        type: 'SUBSCRIBE',
        nodeId,
      })
    );
  }

  // Return unsubscribe function
  return () => {
    const callbacks = subscribers.get(nodeId);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) {
        callbacks.splice(idx, 1);
      }
    }

    // Unsubscribe if no more listeners
    if (callbacks?.length === 0 && wsConnection?.readyState === WebSocket.OPEN) {
      wsConnection.send(
        JSON.stringify({
          type: 'UNSUBSCRIBE',
          nodeId,
        })
      );
    }
  };
};

/**
 * Initialize WebSocket connection for real-time updates
 */
const initWebSocketConnection = () => {
  try {
    wsConnection = new WebSocket(WS_URL);

    wsConnection.onopen = () => {
      console.log('Metrics WebSocket connected');
    };

    wsConnection.onmessage = (event) => {
      try {
        const { nodeId, metrics } = JSON.parse(event.data);
        
        // Update cache
        metricsCache.set(nodeId, {
          data: metrics,
          fetchedAt: Date.now(),
        });

        // Notify all subscribers for this node
        const callbacks = subscribers.get(nodeId) || [];
        callbacks.forEach((cb) => {
          try {
            cb(metrics);
          } catch (err) {
            console.error('Metrics callback error:', err);
          }
        });
      } catch (err) {
        console.error('Failed to parse metrics message:', err);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('Metrics WebSocket error:', error);
    };

    wsConnection.onclose = () => {
      console.log('Metrics WebSocket closed');
      wsConnection = null;
      // Attempt reconnect after 3 seconds
      setTimeout(initWebSocketConnection, 3000);
    };
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
  }
};

/**
 * Disconnect WebSocket
 */
export const disconnectMetricsSocket = () => {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
  subscribers.clear();
  metricsCache.clear();
};

/**
 * Poll metrics for a node at regular intervals
 */
export const pollNodeMetrics = (nodeId, interval = 5000, onUpdate) => {
  const timer = setInterval(async () => {
    try {
      const metrics = await fetchNodeMetrics(nodeId);
      onUpdate(metrics);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(timer);
};
