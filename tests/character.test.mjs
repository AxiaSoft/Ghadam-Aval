import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { instantiateCharacterRig, buildFallbackCharacterTemplate } from '../src/characters/CharacterBuilder.ts';

async function load(path) {
  const bytes = await readFile(path);
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
}
function meshes(node) {
  const found = []; node.traverse(child => { if (child.isMesh) found.push(child); }); return found;
}
for (const character of ['male', 'female']) {
  test(`${character}: clothing tint preserves skin and source model`, async () => {
    const template = await load(`public/models/${character}_character.glb`);
    const before = meshes(template).map(mesh => mesh.material.color?.getHex());
    const first = instantiateCharacterRig(template, { tintSweater: '#2255bb' });
    const originalMeshes = meshes(template);
    const cloneMeshes = meshes(first.root);
    let changed = 0, unchanged = 0;
    for (let i = 0; i < originalMeshes.length; i++) {
      if (originalMeshes[i].material !== cloneMeshes[i].material) changed++;
      else unchanged++;
    }
    assert.ok(changed > 0, 'sweater is tinted');
    assert.ok(unchanged > changed, 'non-clothing details keep their original materials');
    assert.deepEqual(originalMeshes.map(mesh => mesh.material.color?.getHex()), before);
    assert.ok(first.glasses);
    assert.ok(first.root.getObjectByName('GlassesRimGroupL'));
    assert.ok(first.root.getObjectByName('GlassesRimGroupR'));
  });
}
test('fallback male model has glasses and recolourable clothing', () => {
  const template = buildFallbackCharacterTemplate('male');
  const rig = instantiateCharacterRig(template, { tintSweater: '#2255bb' });
  assert.ok(rig.glasses);
  assert.ok(meshes(rig.root).some(mesh => mesh.material.color?.getHexString() === '2255bb'));
});
