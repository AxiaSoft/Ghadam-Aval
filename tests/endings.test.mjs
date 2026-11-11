import test from 'node:test';
import assert from 'node:assert/strict';
import { getEndingPresentation } from '../src/narrative/endings.ts';

test('endings retain the chosen story outcome without old questionnaire details', () => {
  const yes = getEndingPresentation('yes');
  const slow = getEndingPresentation('slow');
  const no = getEndingPresentation('no');
  assert.equal(yes.title, 'پس پنجشنبه، قبل از کلاس.');
  assert.equal(slow.title, 'همین خط، فعلاً کافی بود.');
  assert.equal(no.title, 'همکلاسی ماندیم.');
  assert.deepEqual(yes.details, []);
  assert.deepEqual(slow.details, []);
  assert.deepEqual(no.details, ['پسر همان پسر دو ردیف جلوتر ماند؛ اسمی رد و بدل نشد.']);
  for (const ending of [yes, slow, no]) {
    assert.doesNotMatch(JSON.stringify(ending), /چیزی که آن روز حالت را سر جا آورد|جایی که دلت میخواست جزوه|چیزی که برایت مهم بود|قرار احتمالی/);
  }
});
