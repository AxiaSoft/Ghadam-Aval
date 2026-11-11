import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARRIVAL_PLAN } from '../src/scenes/arrivalPlan.ts';

test('arrival objectives follow the lost-card story in order', () => {
  const objectives = [...ARRIVAL_PLAN[1], ...ARRIVAL_PLAN[2]];
  assert.deepEqual(objectives.map(item => item.id), ['search-bag', 'check-board', 'take-card', 'go-to-entrance']);
  assert.deepEqual(objectives[1].position, objectives[2].position);
  assert.equal(new Set(objectives.map(item => item.id)).size, 4);
  for (const item of objectives) {
    assert.ok(item.hint && item.label && item.caption);
    assert.ok(item.radius > 0 && item.position[0] >= -5.5 && item.position[0] <= 5.5);
    assert.ok(item.position[2] >= -5.5 && item.position[2] <= 5.5);
  }
});
