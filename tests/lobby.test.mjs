import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceLobbyWalk, planLobbyDeparture } from '../src/scenes/lobbyDeparture.ts';
import { ProceduralAnimator } from '../src/animation/ProceduralAnimator.ts';
import { buildFallbackCharacterTemplate, instantiateCharacterRig } from '../src/characters/CharacterBuilder.ts';

test('meeting position stays near the player and inside the lobby', () => {
  assert.deepEqual(planLobbyDeparture(-0.4, 3), { female: [-0.4, 0, 3], male: [0.48, 0, 3] });
  const edge = planLobbyDeparture(6.2, 6.3);
  assert.ok(edge.male[0] < 6.2 && edge.female[2] <= 5.5);
  assert.equal(planLobbyDeparture(0, -2).female[2], 2.05);
});
test('walk speed depends on distance and never overshoots', () => {
  assert.ok(Math.abs(advanceLobbyWalk(0, 3, 0.1) - 0.05) < 1e-9);
  assert.equal(advanceLobbyWalk(0.99, 1, 0.1), 1);
  assert.equal(advanceLobbyWalk(0, 3, -1), 0);
});
test('seated wait gesture raises a hand silently and returns it to rest', () => {
  const rig = instantiateCharacterRig(buildFallbackCharacterTemplate('male'));
  const animator = new ProceduralAnimator();
  const update = (pose, seated) => {
    for (let i = 0; i < 120; i++) animator.update(rig, 1 / 60, { pose, seated, isFemale: false });
  };
  update('sit', true);
  const seatedArm = rig.armR.rotation.x;
  update('wait_gesture', true);
  assert.ok(rig.armR.rotation.x < seatedArm - 0.3, 'gesture lifts the arm');
  assert.ok(rig.hips.position.y < 0.7, 'gesture stays seated');
  update('idle', false);
  assert.ok(rig.armR.rotation.x > -0.2, 'arm returns to rest');
  assert.ok(rig.hips.position.y > 0.85, 'character stands up');
});
test('hiding glasses on a female background character does not change the source', () => {
  const source = buildFallbackCharacterTemplate('female');
  const student = instantiateCharacterRig(source, { hideGlasses: true });
  assert.equal(student.glasses.visible, false);
  assert.equal(source.getObjectByName('Glasses3D').visible, true);
});
