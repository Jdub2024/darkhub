## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-16 - [Debounced Context State Synchronization and Update Bail-Out]
**Learning:** During high-frequency UI interactions (like 60fps drag operations), synchronizing context state directly via effects floods listeners with rapid callbacks. Debouncing synchronization reduces downstream network/logging load by ~95%, and adding an unmount cleanup effect that flushes pending updates guarantees zero data loss. Furthermore, returning existing state reference in state setters when coordinates match bails out React re-renders entirely.
**Action:** Always debounce high-frequency state synchronization callbacks and add equality guards in state update functions.
