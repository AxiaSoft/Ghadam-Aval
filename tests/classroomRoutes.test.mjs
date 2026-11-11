import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESK_COLS_X, DESK_ROWS_Z, classroomExitRoute, classroomFurniture } from '../src/scenes/classroomRoutes.ts';

// Check the whole swept path at intervals, with clearance for a standing character.
test('every seat has a furniture-free route to the classroom door', () => {
  const furniture = classroomFurniture();
  const radius = 0.18;
  for (let row = 0; row < DESK_ROWS_Z.length; row++) for (let col = 0; col < DESK_COLS_X.length; col++) {
    const route = classroomExitRoute(row, col);
    assert.deepEqual(route.at(-1), { x: -4.35, z: 4.43 });
    for (let i = 0; i < route.length - 1; i++) for (let j = 0; j <= 100; j++) {
      const t = j / 100;
      const x = route[i].x * (1 - t) + route[i + 1].x * t;
      const z = route[i].z * (1 - t) + route[i + 1].z * t;
      for (const box of furniture) {
        const nearestX = Math.max(box.minX, Math.min(box.maxX, x));
        const nearestZ = Math.max(box.minZ, Math.min(box.maxZ, z));
        assert.ok(Math.hypot(x - nearestX, z - nearestZ) >= radius - 1e-9, `row ${row}, col ${col}, segment ${i}`);
      }
    }
  }
});

test('player waypoint tolerance still clears the furniture', () => {
  const furniture = classroomFurniture(), route = classroomExitRoute(3, 0);
  let x = route[0].x, z = route[0].z;
  for (const target of route.slice(1)) {
    for (let tick = 0; Math.hypot(target.x - x, target.z - z) > .14 && tick < 1000; tick++) {
      const dx = target.x - x, dz = target.z - z, d = Math.hypot(dx, dz);
      const step = Math.min(d, 2.65 * .85 / 60);
      x += dx / d * step; z += dz / d * step;
      for (const box of furniture) {
        const nx = Math.max(box.minX, Math.min(box.maxX, x));
        const nz = Math.max(box.minZ, Math.min(box.maxZ, z));
        assert.ok(Math.hypot(x - nx, z - nz) >= .18 - 1e-9, 'player shortcut clips furniture');
      }
    }
  }
});
