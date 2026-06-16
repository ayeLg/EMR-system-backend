-- PHI encryption: widen encrypted columns + add NRC blind index.

-- Encrypted ciphertext is longer than the plaintext; widen the columns.
ALTER TABLE "patients" ALTER COLUMN "firstName" TYPE VARCHAR(255);
ALTER TABLE "patients" ALTER COLUMN "lastName" TYPE VARCHAR(255);
ALTER TABLE "patients" ALTER COLUMN "nrcNumber" TYPE VARCHAR(255);

-- The unique constraint on a non-deterministic ciphertext is meaningless;
-- dedup is enforced via the blind-index hash instead.
DROP INDEX IF EXISTS "patients_nrcNumber_key";

-- Name index over encrypted columns is useless for search.
DROP INDEX IF EXISTS "patients_lastName_firstName_idx";

-- Blind index (HMAC) for NRC equality search.
ALTER TABLE "patients" ADD COLUMN "nrcHash" VARCHAR(64);
CREATE INDEX "patients_nrcHash_idx" ON "patients"("nrcHash");
