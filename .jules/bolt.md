## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-06-25 - [Debounced State Synchronization & Bail-out Equality Guards]
**Learning:** High-frequency drag updates (60fps) in interactive canvas contexts flood consumers and external callbacks (`autoSync`/`onStateChange`) when not debounced. Additionally, redundant pointer move events with unchanged coordinates trigger unnecessary React reconciliation passes unless state updates implement coordinate equality guards to bail out.
**Action:** Implement debounced batching for external synchronization callbacks and equality guards in position updater callbacks.
