import React from 'react';
import { FunnelProvider } from '../revenue-engine/context/FunnelProvider';
import FunnelArchitect from '../revenue-engine/components/FunnelArchitect';

const initialNodes = [
  {
    id: 'node_trf_001',
    type: 'traffic',
    label: 'Paid Meta Framework',
    position: { x: 60, y: 120 },
    metrics: { volume: '24k', cpc: '$0.38' },
  },
  {
    id: 'node_lnd_001',
    type: 'landing_page',
    label: 'V1 Main Sales Flow',
    position: { x: 420, y: 220 },
    metrics: { views: '18k', cr: '4.2%' },
  },
  {
    id: 'node_chk_001',
    type: 'checkout',
    label: 'Premium Suite Core',
    position: { x: 780, y: 140 },
    metrics: { sales: '756', conversion: '12%' },
  },
];

const initialEdges = [
  { id: 'edge_001', source: 'node_trf_001', target: 'node_lnd_001', isActive: true },
  { id: 'edge_002', source: 'node_lnd_001', target: 'node_chk_001', isActive: false },
];

function App() {
  const handleStateChange = (state) => {
    console.log('Funnel state updated:', state);
    // Optional: Send to analytics, webhook, etc.
  };

  return (
    <FunnelProvider
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      onStateChange={handleStateChange}
      autoSync={true}
    >
      <div style={{ width: '100%', height: '100vh', background: '#000000' }}>
        <FunnelArchitect />
      </div>
    </FunnelProvider>
  );
}

export default App;
