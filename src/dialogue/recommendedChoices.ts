/** Suggested routes are visual guidance only; every choice remains available. */
export const RECOMMENDED_CHOICES: Readonly<Record<string, string>> = {
  lobby_open: 'line_photo',
  male_why_waited: 'why_plain',
  male_small_invitation: 'final_yes',
};

export function isRecommendedChoice(nodeId: string, choiceId: string): boolean {
  return RECOMMENDED_CHOICES[nodeId] === choiceId;
}
