import test from 'node:test';
import assert from 'node:assert/strict';
import { getPostgameKind } from '../src/ui/postgameMenu.ts';
import { getEndingPresentation } from '../src/narrative/endings.ts';

test('postgame menu follows the ending, including the early relationship ending', () => {
  for (const kind of ['yes', 'slow', 'no']) {
    assert.equal(getPostgameKind('no', kind), kind);
    assert.ok(getEndingPresentation(kind).title);
  }
  assert.equal(getPostgameKind('yes', 'yes'), 'relationship');
  assert.equal(getPostgameKind(null, null), 'slow');
  assert.notEqual(getEndingPresentation('yes').title, getEndingPresentation('no').title);
});
