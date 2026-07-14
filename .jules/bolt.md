## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Debounced Synchronization and State Bail-outs in FunnelProvider]
**Learning:** High-frequency state updates (like dragging nodes) coupled with immediate external synchronization (via `onStateChange`) can cause massive CPU spikes and redundant backend calls. Implementing a simple equality guard in the state setter and debouncing the sync effect drastically reduces the workload.
**Action:** Always debounce external sync callbacks triggered by interactive state changes and use functional state updates with equality checks.
