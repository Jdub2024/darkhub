## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Interactive State Bail-outs and Custom Memoization]
**Learning:** High-frequency state updates (like dragging) can be optimized by implementing equality guards in state update functions. If the new coordinates match the old ones, returning the previous state reference prevents a React re-render cycle entirely. Furthermore, `React.memo` with a custom comparison for coordinate objects prevents unnecessary sub-component re-renders when parent object references change but values remain the same.
**Action:** Implement state bail-outs and custom memo comparisons for high-frequency interactive components.
