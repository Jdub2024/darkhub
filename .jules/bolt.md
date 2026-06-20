## 2025-05-15 - [Initial Exploration]
**Learning:** The FunnelArchitect component re-renders all nodes and edges whenever a single node is dragged. getEdgeCoordinates has O(E*N) complexity.
**Action:** Implement memoization for nodes and edges, and optimize edge coordinate lookups using a Map.

## 2025-05-15 - [Memoization Pattern]
**Learning:** React.memo() with object props (like `position`) can still trigger re-renders if the parent component creates new object references on each render.
**Action:** Flatten object props into primitives (e.g., `posX`, `posY`) to allow for efficient $O(1)$ shallow comparisons by React.memo.
