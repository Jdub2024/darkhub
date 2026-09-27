## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-06-25 - [Flattening Edge Props for React.memo in Canvas Rendering]
**Learning:** Passing object props (e.g., `{ sourcePos, targetPos }`) to memoized sub-components like `SvgEdge` breaks `React.memo` because newly created object references trigger re-renders even when coordinate values are unchanged. Flattening position objects into primitive numbers (`sourceX`, `sourceY`, `targetX`, `targetY`) allows default shallow equality checks to succeed and skip rendering unaffected edges.
**Action:** Always flatten coordinate and state props into primitive types when memoizing sub-components in high-frequency interactive canvas UIs.
