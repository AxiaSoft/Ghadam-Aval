import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { instantiateCharacterRig } from '../src/characters/CharacterBuilder.ts';
import { ProceduralAnimator } from '../src/animation/ProceduralAnimator.ts';

for (const [model, female, hips] of [['male_character', false, .963], ['female_character', true, .9], ['student_npc', false, .88]]) {
  test(`${model}: seated hands rest near the thighs, desk pose remains separate`, async () => {
    const bytes = await readFile(`public/models/${model}.glb`);
    const scene = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
    const rig = instantiateCharacterRig(scene);
    const animator = new ProceduralAnimator();
    const update = (params) => { for (let i = 0; i < 180; i++) animator.update(rig, 1/60, { isFemale: female, baseHipsY: hips, ...params }); rig.root.updateMatrixWorld(true); };
    update({ pose: 'talk', seated: true, isSpeaking: true });
    for (const side of ['L', 'R']) {
      const thigh = rig[`upLeg${side}`].localToWorld(new THREE.Vector3(0, -.19, .06));
      const hand = rig[`hand${side}`];
      const position = hand ? hand.getWorldPosition(new THREE.Vector3()) : rig[`foreArm${side}`].localToWorld(new THREE.Vector3(0, -.2, 0));
      assert.ok(position.distanceTo(thigh) < .09, `${side} hand should be near the thigh: ${position.distanceTo(thigh)}`);
    }
    update({ pose: 'sit', seatHands: 'desk' });
    assert.ok(rig.foreArmL.rotation.x < -.7, 'desk pose keeps its original arm position');
  });
}
