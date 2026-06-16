## 2025-05-14 - [Performance Patterns for Node-Based Editors]
**Learning:** In interactive node-based UIs, two key performance bottlenecks are O(N*E) edge coordinate calculations and unnecessary re-renders of all nodes when only one moves.
**Action:**
1. Use a `Map` (via `useMemo`) to index nodes by ID for O(1) lookups during edge calculation, reducing complexity to O(N+E).
2. Memoize node and edge sub-components using `React.memo`.
3. Flatten position/coordinate props (e.g., use `x`, `y` instead of a `position` object) to ensure `React.memo`'s shallow comparison works effectively even if parent objects are recreated.
