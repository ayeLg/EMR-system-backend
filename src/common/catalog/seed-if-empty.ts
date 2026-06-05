/**
 * Runs `seed` only when `count()` returns 0 — used by catalog services on boot.
 */
export async function seedIfEmpty(
  count: () => Promise<number>,
  seed: () => Promise<unknown>,
): Promise<void> {
  if ((await count()) > 0) return;
  await seed();
}
