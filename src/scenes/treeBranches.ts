/** Branches grow from the trunk into the foliage; coordinates are local to the tree. */
export const TREE_BRANCHES: ReadonlyArray<{ start: readonly [number, number, number]; end: readonly [number, number, number] }> = [
  { start: [0, 1.82, 0], end: [-.48, 2.48, .05] },
  { start: [0, 1.84, 0], end: [.5, 2.5, -.08] },
  { start: [0, 1.86, 0], end: [0, 2.46, .4] },
  { start: [0, 1.9, 0], end: [-.25, 2.65, -.3] },
  { start: [0, 1.92, 0], end: [.3, 2.7, .3] },
];
