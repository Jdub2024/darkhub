# Automated Revenue Engine Machine - Design System

## Concept
An authoritative, high-end financial terminal for managing automated revenue funnels and streams. The design focuses on "Stealth Wealth"—minimalist, precise, and elite.

## Design Tokens (Obsidian Command)
- **Primary Color**: Emerald Green (#50C878) - Growth, Active Status, Success.
- **Secondary Color**: Gold (#D4AF37) - Wealth, ROI, Payouts, Premium Actions.
- **Background**: Obsidian Black (#000000) and Deep Charcoal (#121317).
- **Typography**:
  - Headlines: **Geist** (Technical Modernism)
  - Data/Labels: **JetBrains Mono** (Precision, Monospaced for numbers)
  - Body: **Inter** (Legibility)

## Architecture
1. **Revenue Command Center (Dashboard)**: Real-time ticker, cash flow graph, and profit optimizer.
2. **Funnel Architect**: Visual node-based builder for automated marketing sequences.
   - **Canvas State Engine**: Single source of truth tracking nodes, coordinates, and linkages.
   - **Render View**: Visual grid translating coordinates into Obsidian UI.
   - **Interactive Layer**: Unified Pointer Events for cross-platform drag support.
   - **Dynamic Routing**: Real-time Bézier path calculation between node anchors.
3. **Revenue Streams Management**: Hub for managing affiliate nodes, SaaS subscriptions, and secure payouts.

## Technical Specifications
### State Schema (JetBrains Mono Precision)
```json
{
  "canvas": { "zoom": 1.0, "panX": 0, "panY": 0 },
  "nodes": [
    {
      "id": "node_trf_001",
      "type": "traffic_source",
      "label": "Meta Ads Campaign Alpha",
      "position": { "x": 120, "y": 250 },
      "metrics": { "cpc": 0.42, "volume": 12500 },
      "data": { "channel": "facebook", "utm_source": "meta" }
    }
  ],
  "edges": [
    {
      "id": "edge_001",
      "source": "node_trf_001",
      "target": "node_lnd_001",
      "isActive": true,
      "flowRate": "475/hr"
    }
  ]
}
```

### Performance Optimization
- **CSS Hardware Acceleration**: Use `translate3d(x, y, 0px)` for node positioning to bypass layout recalculation.
- **State Decoupling**: Isolate SVG canvas redraws to maintain 60fps during node interaction.
- **Synthetic Pointer Events**: Unified `onPointer` handlers for native response speeds on mobile and desktop.

## User Experience
- High information density with high contrast.
- Glassmorphism for depth and hierarchy.
- Proactive AI-driven optimization feedback.
