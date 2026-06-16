-- Critical-value protocol: track notification + acknowledgement on lab results
ALTER TABLE "lab_results" ADD COLUMN "criticalNotifiedAt" TIMESTAMP(3);
ALTER TABLE "lab_results" ADD COLUMN "criticalAckAt" TIMESTAMP(3);
ALTER TABLE "lab_results" ADD COLUMN "criticalAckById" UUID;

CREATE INDEX "lab_results_isCritical_criticalAckAt_idx" ON "lab_results"("isCritical", "criticalAckAt");
