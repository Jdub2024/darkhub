## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Debounced Synchronization and State Bail-out in Context]
**Learning:** High-frequency interactions like dragging in a node-based UI can flood external synchronization callbacks (e.g., `onStateChange`) and trigger redundant re-renders. Using a `useRef` for the callback reference combined with a `setTimeout` debounce prevents "callback starvation" and unnecessary overhead. Additionally, implementing equality guards in state update functions allows React to bail out of the reconciliation process entirely if the data hasn't changed.
**Action:** Implement debounced synchronization for external state updates and use equality guards in state setters to skip redundant re-renders.
