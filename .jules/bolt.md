## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-07-28 - [State Update Bail-out and Synchronization Debouncing]
**Learning:** Drag-and-drop operations trigger state updates at ~60fps. Propagating these high-frequency events directly to external callback props (like `onStateChange`) can cause extreme lag due to downstream rendering/synchronization overhead. Additionally, calling the React state setter with a new object reference when position coordinates are identical bypasses React's bail-out and triggers redundant reconciliation across the whole hook's consumer tree.
**Action:** Debounce high-frequency external state callbacks with a ref wrapper to prevent starvation/reset loops, and apply strict equality checks in state updaters to bail out and preserve identity references.
