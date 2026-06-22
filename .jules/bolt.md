## 2025-05-15 - Node Indexing in Funnel Architect
**Learning:** Found O(N*E) complexity in edge coordinate calculations due to repeated `.find()` calls on the nodes array inside the edges mapping.
**Action:** Use a Map to index nodes by ID for O(1) lookups before processing edges, reducing complexity to O(N+E).
