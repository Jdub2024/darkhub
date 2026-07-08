## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-24 - [Debounced Synchronization & Equality Guards]
**Learning:** Frequent state updates from dragging operations (60fps) can overwhelm parent components and external listeners. Debouncing synchronization (150ms) and implementing coordinate equality guards in the state update function drastically reduces redundant processing (e.g., from 22 updates to 1 in a typical drag).
**Action:** Implement equality guards for coordinate-based state updates and debounce external callbacks in high-frequency interaction contexts.
