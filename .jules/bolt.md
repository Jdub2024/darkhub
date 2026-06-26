## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-22 - [Optimizing High-Frequency Updates in Node-Based UIs]
**Learning:** Passing object props to memoized components (like `SvgEdge`) causes re-renders even if contents are identical because the parent recreates the object on each render. Flattening props to primitives allows `React.memo` to work correctly. Also, debouncing external state syncs during high-frequency events (dragging) significantly reduces main thread overhead.
**Action:** Prefer primitive props for memoized components and implement equality guards/debouncing for state updates triggered by continuous interactions.
