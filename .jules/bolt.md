## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Effective State Bail-out in React]
**Learning:** Returning the same object references within a `.map()` call inside `setNodes` still creates a new array reference, which triggers a React state update and component re-render. To truly bail out, the update function must return the original state array (`prevNodes`) if no changes were detected.
**Action:** When updating collections in state, use a change flag to determine whether to return the new collection or the original reference.
