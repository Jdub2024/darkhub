## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2025-06-29 - [Stable Callback Debouncing Pattern]
**Learning:** When debouncing external state synchronization callbacks in a useEffect, including the callback prop as a dependency causes the timer to reset whenever the callback reference changes (common if the parent doesn't use useCallback). Storing the callback in a useRef allows the effect to access the latest function without being a dependency, ensuring the debounce timer only responds to actual data changes.
**Action:** Use the useRef pattern for unstable external callbacks to prevent 'callback starvation' or redundant timer resets in debounced effects.
