import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_CHATTER, initialChatterState, updateChatter } from '../src/scenes/campusChatter.ts';

test('chatter triggers on approach, expires, and does not interrupt the main task', () => {
  const lines = CAMPUS_CHATTER.seated;
  let state = initialChatterState();
  state = updateChatter(state, 2.1, .1, true, false, lines, () => 0);
  assert.equal(state.line, lines[0]);
  const paused = updateChatter(state, 2.1, 8, true, true, lines);
  assert.deepEqual(paused, state);
  state = updateChatter(state, 2.1, 5, true, false, lines);
  assert.equal(state.line, null);
  state = updateChatter(state, 2.1, 10, true, false, lines);
  assert.equal(state.line, null, 'staying nearby does not retrigger');
  state = updateChatter(state, 3, .1, true, false, lines);
  state = updateChatter(state, 2, .1, true, false, lines, () => 0);
  assert.equal(state.line, lines[1], 'avoid the previous line');
  state = updateChatter(state, 2, .1, false, false, lines);
  assert.equal(state.line, null, 'entering the building closes chatter');
});

test('both students have approved lines and range hysteresis avoids retriggering', () => {
  assert.equal(CAMPUS_CHATTER.seated.length, 3);
  assert.equal(CAMPUS_CHATTER.standing.length, 3);
  let s = updateChatter(initialChatterState(), 2, 0, true, false, CAMPUS_CHATTER.standing, () => .9);
  assert.equal(s.line, CAMPUS_CHATTER.standing[2]);
  s = updateChatter(s, 2.5, .1, true, false, CAMPUS_CHATTER.standing);
  assert.equal(s.nearby, true);
  s = updateChatter(s, 3, .1, true, false, CAMPUS_CHATTER.standing);
  assert.equal(s.line, null);
});
