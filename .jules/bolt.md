# Bolt's Journal - Critical Learnings

## 2025-05-15 - [Initial Performance Patterns]
**Learning:** In node-based editors, edge calculations often involve searching for nodes by ID, resulting in O(N*E) complexity. Using a Map for O(1) node lookups reduces this to O(N+E). Additionally, React.memo is more effective when props are primitive values rather than objects.
**Action:** Use useMemo to create node maps and flatten props for memoized components like nodes and edges.
