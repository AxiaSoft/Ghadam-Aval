import test from 'node:test';
import assert from 'node:assert/strict';
import { TREE_BRANCHES } from '../src/scenes/treeBranches.ts';

test('tree branches grow upwards from the trunk into the crown', () => {
  assert.ok(TREE_BRANCHES.length >= 3);
  for (const { start, end } of TREE_BRANCHES) {
    assert.ok(end[1] - start[1] >= .5, 'branch tip should rise clearly above its base');
    assert.ok(start[1] >= 1.8 && start[1] < 2.06, 'branch base should join the upper trunk');
    assert.ok(Math.hypot(start[0], start[2]) < .1, 'branch should start at the trunk');
    assert.ok(end[1] >= 2.3 && Math.hypot(end[0], end[2]) <= .75, 'branch tip should reach the crown');
  }
});
