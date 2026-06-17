## 2025-05-15 - [SVG Path Logic Error]
**Learning:** When refactoring components to use flattened primitive props (e.g., sourceX, sourceY) for memoization, it's easy to introduce typos in template strings (e.g., using sourceX where sourceY is required).
**Action:** Double-check all coordinate variables in SVG path strings after flattening props.

## 2025-05-15 - [Node Map Optimization]
**Learning:** In node-based editors, calculating edge coordinates by searching the nodes array for each edge is O(N*E). Indexing nodes in a Map reduces this to O(N+E).
**Action:** Always use a Map for node lookups when rendering edges in complex graph UIs.
