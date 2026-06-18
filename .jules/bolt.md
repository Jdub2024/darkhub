## 2025-05-15 - Node Indexing Pattern for Edge Calculations
**Learning:** In interactive node-based UIs, calculating edge coordinates by searching through a node array for every edge in every render leads to O(N*E) complexity. Dragging a single node triggers expensive lookups for all edges.
**Action:** Use `useMemo` to create a Map/Object index of nodes by ID. This reduces complexity to O(N+E) and ensures that edge coordinate derivation remains performant even as the graph scales.
