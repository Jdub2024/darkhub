## 2025-05-15 - [Algorithmic and Context Optimizations in Funnel Architect]
**Learning:** In node-based UIs, calculating edge coordinates by searching through nodes for each edge results in O(N*E) complexity. Converting nodes to a Map once per render reduces this to O(N+E), which scales much better for large graphs. Additionally, failing to memoize context values triggers unnecessary re-renders for all consumers.
**Action:** Always check for nested O(N) searches in render loops and ensure context values are wrapped in `useMemo`.

## 2026-07-07 - [Primitive Props and CI Optimization]
**Learning:** Passing objects as props to memoized components (like SvgEdge) breaks React.memo shallow comparison, as new object references are created on every render. Flattening these into primitive props (numbers/strings) allows for effective bail-outs. Additionally, simplifying CI matrix versions can help bypass transient infrastructure issues while maintaining coverage for the primary environment.
**Action:** Prefer primitive props for low-level memoized components in high-frequency update paths.
