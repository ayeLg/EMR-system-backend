/** Normalize for fuzzy name comparison: lowercase, trim, collapse whitespace. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Sørensen–Dice coefficient over character bigrams. Returns 0..1 where 1 is an
 * exact match. Used for duplicate-patient name similarity (CLAUDE.md Feature 1).
 */
export function diceCoefficient(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;

  const bigrams = (s: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i += 1) {
      const bg = s.slice(i, i + 2);
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };

  const ba = bigrams(x);
  const bb = bigrams(y);
  let intersection = 0;
  for (const [bg, count] of ba) {
    const other = bb.get(bg);
    if (other) intersection += Math.min(count, other);
  }

  return (2 * intersection) / (x.length - 1 + (y.length - 1));
}
