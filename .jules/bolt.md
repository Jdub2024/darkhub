## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-08-08 - [Debounced Synchronization & State update bail-outs]
**Learning:** During drag events in canvas/node-based editors, high-frequency position updates trigger massive reconciliation overhead and redundant external callback calls. Implementing a state update bail-out guard on coordinates ensures that unchanged drags bypass state updates completely. Further, storing external callbacks in a `useRef` and debouncing prevents callback starvation and excessive synchronization runs.
**Action:** Use coordinates-based equality guards to return the exact same array reference in high-frequency events and use a ref-backed setTimeout debounce for callbacks.
