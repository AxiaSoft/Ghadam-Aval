import type { EndingVariant, RelationshipAnswer } from '../types/game';

/** The early relationship ending takes priority over any older saved story ending. */
export function getPostgameKind(relationship: RelationshipAnswer | null, ending: EndingVariant | null): EndingVariant | 'relationship' {
  return relationship === 'yes' ? 'relationship' : ending ?? 'slow';
}
