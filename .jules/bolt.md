## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [State Update Bail-outs and Debounced Sync]
**Learning:** High-frequency state updates (like dragging) can be optimized by returning the previous state reference if no data actually changed (bail-out). Furthermore, wrapping external sync callbacks in a ref prevents effect thrashing, and debouncing them reduces the cost of secondary operations like analytics or persistence.
**Action:** Always implement equality guards in state setters for high-frequency interactions and debounce external synchronization effects.
