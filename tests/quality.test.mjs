import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialQualitySample, sampleQuality } from '../src/graphics/qualityMonitor.ts';

function run(sample, fps, seconds, level) {
  let result = null;
  for (let i = 0; i < fps * seconds; i++) result = sampleQuality(sample, 1 / fps, false, level) ?? result;
  return result;
}
test('requires two sustained slow windows and keeps a cooldown', () => {
  const sample = initialQualitySample(); sample.cooldown = 0;
  assert.equal(run(sample, 20, 5, 'HIGH'), null);
  assert.equal(run(sample, 20, 6, 'HIGH'), 'MEDIUM');
  assert.equal(run(sample, 20, 6, 'MEDIUM'), null);
});
test('healthy frames and pauses break a slow streak', () => {
  const sample = initialQualitySample(); sample.cooldown = 0;
  run(sample, 20, 5, 'HIGH');
  assert.equal(sampleQuality(sample, .1, true, 'HIGH'), null);
  assert.equal(run(sample, 20, 5, 'HIGH'), null);
  assert.equal(run(sample, 60, 6, 'HIGH'), null);
  assert.equal(run(sample, 20, 5, 'HIGH'), null);
});
test('very slow devices still downgrade and LOW stays LOW', () => {
  const sample = initialQualitySample(); sample.cooldown = 0;
  assert.equal(run(sample, 2, 11, 'MEDIUM'), 'LOW');
  sample.cooldown = 0;
  assert.equal(run(sample, 10, 12, 'LOW'), null);
});
