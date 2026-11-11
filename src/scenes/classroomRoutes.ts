export type Point2D = { x: number; z: number };
export interface Rectangle { minX: number; maxX: number; minZ: number; maxZ: number }
export const DESK_ROWS_Z = [-2.3, -0.55, 1.2, 2.95];
export const DESK_COLS_X = [-2.2, 0, 2.2];
export const CHAIR_SLIDE = 0.46;

/** First step sideways between the desk and the pulled-back chair, then use the aisles. */
export function classroomExitRoute(row: number, col: number): Point2D[] {
  const x = DESK_COLS_X[col];
  const z = DESK_ROWS_Z[row] + 0.36;
  const aisle = col === 0 ? -3.3 : col === 1 ? -1.1 : 1.1;
  return [{ x, z }, { x: aisle, z }, { x: aisle, z: 4.43 }, { x: -4.35, z: 4.43 }];
}

/** Obstacles reflect the actual desk and moved chair footprints, not round approximations. */
export function classroomFurniture(): Rectangle[] {
  return DESK_ROWS_Z.flatMap(z => DESK_COLS_X.flatMap(x => [
    { minX: x - 0.525, maxX: x + 0.525, minZ: z - 0.42, maxZ: z + 0.14 },
    { minX: x - 0.23, maxX: x + 0.23, minZ: z + 0.36 + CHAIR_SLIDE - 0.22, maxZ: z + 0.36 + CHAIR_SLIDE + 0.22 },
  ]));
}
