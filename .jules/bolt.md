## 2024-06-24 - Edge Memoization Strategy
**Learning:** Wrapping sub-components in `React.memo` is only fully effective if props are primitives or stable objects. In the FunnelArchitect, passing a `coords` object that is recreated in `useMemo` means `SvgEdge` still re-renders when any node moves, because the object reference changes.
**Action:** In future high-frequency interaction UIs, prefer flattening object props into primitives (e.g., `sourceX`, `sourceY`) to ensure `React.memo` shallow comparison works as intended.
