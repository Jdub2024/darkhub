## 2026-07-11 - [Debouncing External Callbacks in React Hooks]
**Learning:** High-frequency state updates (like dragging) that trigger external callbacks (e.g., `onStateChange`) can overwhelm listeners and cause performance degradation. Implementing a debounce within a `useEffect` using `useRef` for the callback and timer ensures that external listeners are only notified after the user stops interacting, without causing redundant effect re-runs or stale closure issues.
**Action:** Use `useRef` to store external callbacks when implementing debounced triggers in hooks to decouple the effect's execution from the callback's reference stability.

## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.
