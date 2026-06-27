## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-06-27 - [Robust Debouncing of External Callbacks]
**Learning:** When debouncing an external callback (like `onStateChange`) in a `useEffect`, if the callback is not memoized by the consumer, it triggers the effect to re-run on every parent render. This resets the debounce timer, potentially leading to 'callback starvation' where the sync never happens during continuous parent updates.
**Action:** Use a `useRef` to hold the latest version of the external callback and exclude it from the `useEffect` dependency array to ensure the debounce timer is only managed by the actual data changes.
