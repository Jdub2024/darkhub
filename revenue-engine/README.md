# Digital Envisioned DESRG - Automated Reporting Tool

**Production-Ready Funnel Architecture System**

## Overview

DESRG is a professional-grade funnel visualization and reporting system for Digital Envisioned's automated reporting workflow. It provides:

- **Interactive Funnel Builder**: Drag-and-drop node creation and connection management
- **Real-Time Metrics**: Live WebSocket updates from analytics backends
- **CI/CD Integration**: Automated report generation triggered from GitHub Actions, GitLab CI, Jenkins
- **State Persistence**: Auto-save to localStorage with export/import capabilities
- **Webhook Integration**: Custom destinations (email, Slack, cloud storage)

## Architecture

### Core Components

```
FunnelProvider (Global State)
├── FunnelArchitect (Visual Canvas)
│   ├── ArchitectNode (Individual Nodes)
│   │   └── Port (Connection Points)
│   └── SvgEdge (Connection Lines)
├── NodeContextMenu (CRUD Operations)
└── EdgeBuilder (Connection Management)
```

### Services

1. **useFunnelState** - State management hook with persistence
2. **metricsService** - Real-time metric updates (polling + WebSocket)
3. **webhookService** - CI/CD and external destination integration
4. **storageService** - Local storage handling

## Installation

```bash
npm install
cp revenue-engine/.env.example revenue-engine/.env.local
```

## Configuration

Edit `.env.local` with your:

- Metrics API endpoint and token
- GitHub (or GitLab/Jenkins) webhook URL and token
- Report destination (email, Slack, storage bucket)

## Usage

### Basic Setup

```jsx
import { FunnelProvider } from './revenue-engine/context/FunnelProvider';
import FunnelArchitect from './revenue-engine/components/FunnelArchitect';

function App() {
  return (
    <FunnelProvider initialNodes={[...]} autoSync={true}>
      <FunnelArchitect />
    </FunnelProvider>
  );
}
```

### Trigger Report Generation

```jsx
const { generateReport } = useFunnelContext();

const handleGenerateReport = async () => {
  const result = await generateReport({
    includeMetrics: true,
    reportFormat: 'html',
    destination: 'slack',
  });
  console.log('Report triggered:', result);
};
```

### Export/Import Funnel State

```jsx
const { exportState, importState } = useFunnelContext();

// Export
const state = exportState();
localStorageService.exportAsFile(state);

// Import
const file = event.target.files[0];
const imported = await localStorageService.importFromFile(file);
importState(imported);
```

## API Reference

### FunnelContext Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addNode` | `node: Object` | `void` | Add a new node |
| `updateNode` | `id: string, updates: Object` | `void` | Update node properties |
| `deleteNode` | `id: string` | `void` | Delete node and connected edges |
| `addEdge` | `edge: Object` | `void` | Create connection between nodes |
| `deleteEdge` | `id: string` | `void` | Delete connection |
| `dragNode` | `id: string, x: number, y: number` | `void` | Update node position during drag |
| `generateReport` | `options: Object` | `Promise<Object>` | Trigger CI/CD report generation |
| `exportState` | `void` | `Object` | Export current funnel state |
| `importState` | `state: Object` | `void` | Import funnel state from JSON |

### Metrics Service

```js
// Fetch single node metrics
const metrics = await fetchNodeMetrics(nodeId);

// Subscribe to real-time updates
const unsubscribe = subscribeToMetricUpdates(nodeId, (metrics) => {
  console.log('Updated metrics:', metrics);
});

// Cleanup
unsubscribe();
```

### Webhook Service

```js
// Trigger CI/CD pipeline
const result = await triggerPipeline(funnelState, {
  includeMetrics: true,
  reportFormat: 'html',
  destination: 'slack',
});

// Send to external destination
const sent = await sendReport(funnelState, 'email', 'html');
```

## Deployment

### Environment Setup

1. **GitHub Actions** (Recommended)
   - Set repository secrets in Settings > Secrets
   - Create workflow file in `.github/workflows/desrg-report.yml`

2. **GitLab CI**
   - Add variables in Settings > CI/CD > Variables
   - Define pipeline in `.gitlab-ci.yml`

3. **Jenkins**
   - Install GitHub plugin
   - Configure webhooks in job settings

### Production Build

```bash
npm run build
# Output in build/ directory
```

## Performance Optimization

- Metrics cached for 5 seconds to reduce API calls
- Debounced state persistence (500ms)
- GPU acceleration for node dragging (willChange: 'transform')
- Memoized edge calculations to prevent unnecessary re-renders
- WebSocket connection pooling for metric updates

## Error Handling

All services include comprehensive error handling:

- Graceful fallbacks if metrics unavailable
- Automatic WebSocket reconnection with exponential backoff
- Persisted state cache for offline access
- Detailed error logging and reporting

## Troubleshooting

### WebSocket Connection Fails

```bash
# Check metrics service is running
curl http://localhost:3001/health

# Verify token in .env.local
# Check CORS settings on metrics server
```

### Report Generation Blocked

```bash
# Verify GitHub token has repo:status scope
# Check webhook endpoint is accessible
# Confirm CI/CD secrets are configured
```

### State Not Persisting

```bash
# Check localStorage is enabled
# Verify no quota exceeded
const size = localStorageService.getStorageSize();
console.log('Storage used:', size, 'bytes');
```

## Security Best Practices

1. ✅ Never commit `.env.local` - use `.env.example` template
2. ✅ Rotate API tokens regularly
3. ✅ Use HTTPS for all webhook endpoints
4. ✅ Validate webhook signatures (HMAC)
5. ✅ Implement rate limiting on CI/CD webhooks
6. ✅ Audit report access and destinations

## Contributing

This is a Digital Envisioned proprietary system. For modifications:

1. Create feature branch: `git checkout -b feat/your-feature`
2. Follow code style in existing components
3. Test all state mutations and side effects
4. Submit PR with detailed description

## License

Proprietary - Digital Envisioned © 2026

## Support

For issues or questions, contact the Digital Envisioned development team.
