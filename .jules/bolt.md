## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-05-20 - [Hot-Path Optimizations for High-Frequency Interaction]
**Learning:** High-frequency events like dragging can trigger massive waterfalls of re-renders and external synchronization. Combining an equality guard in the state setter, custom value-based memoization for components receiving transient object props, and debouncing external sync callbacks creates a much smoother experience.
**Action:** Implement debouncing for any state-sync callback that could be triggered >10 times per second.
