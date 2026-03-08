/**
 * Generate deterministic colors for members based on their names
 */

const COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#FFA07A', // light salmon
  '#98D8C8', // mint
  '#F7DC6F', // yellow
  '#BB8FCE', // purple
  '#85C1E2', // sky blue
  '#F8B739', // orange
  '#52B788', // green
];

/**
 * Generate a color for a member based on their name
 * Same name always gets the same color
 */
export function generateMemberColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

/**
 * Get all available colors
 */
export function getAvailableColors(): string[] {
  return [...COLORS];
}
