## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Testing Debounced Context Providers with Jest Fake Timers]
**Learning:** When a React context provider schedules a debounced synchronization callback on mount, Jest fake timer tests must let this mounting timer resolve and clear the mock function before executing test assertions on subsequent events. Otherwise, the unresolved mounting timer triggers the mock unexpectedly during the test actions.
**Action:** Always advance timers by the debounce delay and clear the mock after rendering a debounced provider in tests before starting interactive assertions.
