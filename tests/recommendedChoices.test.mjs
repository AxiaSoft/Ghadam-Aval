import test from 'node:test';
import assert from 'node:assert/strict';
import { RECOMMENDED_CHOICES, isRecommendedChoice } from '../src/dialogue/recommendedChoices.ts';

test('only the explicitly suggested story choices receive a visual recommendation', () => {
  assert.equal(isRecommendedChoice('lobby_open', 'line_photo'), true);
  assert.equal(isRecommendedChoice('lobby_open', 'line_compare'), false);
  assert.equal(isRecommendedChoice('male_why_waited', 'why_plain'), true);
  assert.equal(isRecommendedChoice('male_small_invitation', 'final_yes'), true);
  assert.equal(isRecommendedChoice('male_small_invitation', 'final_no'), false);
  assert.equal(isRecommendedChoice('unknown', 'line_photo'), false);
  assert.equal(Object.keys(RECOMMENDED_CHOICES).length, 3);
});
