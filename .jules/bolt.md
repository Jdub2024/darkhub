## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-06-28 - [Debounced State Synchronization in FunnelProvider]
**Learning:** High-frequency state updates (like dragging) can overwhelm external synchronization logic. Using a `useRef` for external callbacks prevents `useEffect` from re-running when the callback reference is unstable, and debouncing with `setTimeout` ensures that expensive synchronization only occurs after activity pauses.
**Action:** Implement debouncing and stable callback refs for any state synchronization triggered by high-frequency user interactions.
