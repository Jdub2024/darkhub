## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Testing Debounced Context Synchronizations with Fake Timers]
**Learning:** In debounced state synchronization in React Context providers, the initial mount render triggers an initial synchronization timeout. In unit tests using fake timers, this initial synchronization can be processed when the timers are advanced, which must be accounted for or mock-cleared before testing subsequent state update/bail-out behaviors.
**Action:** Always advance timers to consume initial mount synchronization timers and clear the mock callback functions before triggering the high-frequency test cases.
