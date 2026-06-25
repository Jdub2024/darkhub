## 2025-05-15 - Funnel Architect Complexity Bottleneck
**Learning:** Found that calculating edge coordinates by using `Array.prototype.find` for every edge leads to $O(N \times E)$ complexity, which can cause significant frame drops in large funnel maps.
**Action:** Always index nodes in a Map for $O(1)$ lookups when calculating relationships in a graph-based UI.
