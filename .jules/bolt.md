## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-07-01 - [Debounced Context Synchronization with Latest Ref Pattern]
**Learning:** When debouncing external state synchronization callbacks (like `onStateChange`) within a `useEffect`, using a `useRef` to capture the latest version of the callback prevents the effect from re-running (and resetting the timer) if the callback reference changes on every render. This is critical when parents pass anonymous functions or haven't memoized their callbacks.
**Action:** Always implement the "latest ref" pattern for external callbacks triggered by high-frequency events to ensure stable debouncing and prevent callback starvation.
