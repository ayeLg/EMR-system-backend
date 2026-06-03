-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AllergenType" AS ENUM ('DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'FATAL');

-- CreateEnum
CREATE TYPE "AllergyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('OPD', 'IPD', 'FOLLOWUP', 'EMERGENCY', 'TELECONSULT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "EncounterType" AS ENUM ('OPD', 'IPD', 'EMERGENCY', 'FOLLOWUP', 'TELECONSULT');

-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiagnosisType" AS ENUM ('PRIMARY', 'SECONDARY', 'COMPLICATION', 'COMORBIDITY', 'ADMITTING', 'DISCHARGE');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CHRONIC', 'SUSPECTED', 'RULED_OUT');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "MedicationRoute" AS ENUM ('ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALED', 'SUBLINGUAL', 'RECTAL', 'NASAL', 'OPHTHALMIC', 'OTIC', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('ORDERED', 'SPECIMEN_COLLECTED', 'IN_PROCESS', 'RESULTED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'INSURANCE', 'MOBILE_PAYMENT', 'BANK_TRANSFER', 'WAIVER');

-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'LAB_RESULT_READY', 'CRITICAL_VALUE', 'MEDICATION_DUE', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" VARCHAR(20) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "roleId" UUID NOT NULL,
    "departmentId" UUID,
    "totpSecret" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "resourceId" UUID,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mrn" VARCHAR(20) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "nrcNumber" VARCHAR(30),
    "bloodType" "BloodType" NOT NULL DEFAULT 'UNKNOWN',
    "photoUrl" TEXT,
    "primaryPhone" VARCHAR(20) NOT NULL,
    "secondaryPhone" VARCHAR(20),
    "email" VARCHAR(150),
    "address" TEXT,
    "city" VARCHAR(100),
    "township" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_insurance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "policyNumber" VARCHAR(50) NOT NULL,
    "memberName" VARCHAR(150) NOT NULL,
    "groupNumber" VARCHAR(50),
    "expiryDate" DATE,
    "coverageDetails" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "patient_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL,
    "allergenType" "AllergenType" NOT NULL,
    "allergenName" VARCHAR(200) NOT NULL,
    "reaction" TEXT NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "status" "AllergyStatus" NOT NULL DEFAULT 'ACTIVE',
    "confirmedById" UUID,
    "onsetDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "departmentId" UUID NOT NULL,
    "totalBeds" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,

    CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointmentNo" VARCHAR(20) NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "chiefComplaint" TEXT,
    "notes" TEXT,
    "bookedById" UUID NOT NULL,
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounterNo" VARCHAR(20) NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "attendingDoctorId" UUID NOT NULL,
    "encounterType" "EncounterType" NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'OPEN',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "wardId" UUID,
    "bedNumber" VARCHAR(10),
    "admissionDate" DATE,
    "dischargeDate" DATE,
    "dischargeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounterId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolicBp" INTEGER,
    "diastolicBp" INTEGER,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "temperatureCelsius" DECIMAL(4,1),
    "oxygenSaturation" DECIMAL(4,1),
    "weightKg" DECIMAL(5,2),
    "heightCm" DECIMAL(5,1),
    "bmi" DECIMAL(4,1),
    "painScore" INTEGER,
    "bloodGlucose" DECIMAL(5,1),
    "notes" TEXT,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounterId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "icd10Code" VARCHAR(10) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "DiagnosisType" NOT NULL,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'ACTIVE',
    "diagnosedById" UUID NOT NULL,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounterId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "noteType" VARCHAR(50) NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "content" TEXT,
    "isAmended" BOOLEAN NOT NULL DEFAULT false,
    "amendedFrom" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounterId" UUID NOT NULL,
    "orderedById" UUID NOT NULL,
    "orderType" VARCHAR(50) NOT NULL,
    "priority" "OrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "details" JSONB,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "medical_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "genericName" VARCHAR(200) NOT NULL,
    "brandName" VARCHAR(200),
    "category" VARCHAR(100) NOT NULL,
    "dosageForm" VARCHAR(50) NOT NULL,
    "strength" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "requiresRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "interactions" JSONB,
    "contraindications" JSONB,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicationId" UUID NOT NULL,
    "batchNumber" VARCHAR(50) NOT NULL,
    "expiryDate" DATE NOT NULL,
    "quantityOnHand" INTEGER NOT NULL,
    "reorderLevel" INTEGER NOT NULL DEFAULT 50,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "supplier" VARCHAR(150),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rxNumber" VARCHAR(20) NOT NULL,
    "encounterId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "prescribedById" UUID NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "prescribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensedAt" TIMESTAMP(3),
    "dispensedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prescriptionId" UUID NOT NULL,
    "medicationId" UUID NOT NULL,
    "dose" VARCHAR(50) NOT NULL,
    "route" "MedicationRoute" NOT NULL,
    "frequency" VARCHAR(50) NOT NULL,
    "durationDays" INTEGER,
    "quantityPrescribed" INTEGER NOT NULL,
    "quantityDispensed" INTEGER,
    "instructions" TEXT,
    "isSubstitutionAllowed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "sampleType" VARCHAR(50) NOT NULL,
    "turnaroundHours" INTEGER NOT NULL DEFAULT 24,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "referenceRanges" JSONB,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNo" VARCHAR(20) NOT NULL,
    "encounterId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "orderedById" UUID NOT NULL,
    "priority" "OrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" TIMESTAMP(3),
    "resultedAt" TIMESTAMP(3),
    "clinicalNotes" TEXT,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "labOrderId" UUID NOT NULL,
    "labTestId" UUID NOT NULL,
    "specimenBarcode" VARCHAR(50),

    CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "labOrderItemId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "resultValue" TEXT NOT NULL,
    "unit" VARCHAR(30),
    "referenceRangeLow" DECIMAL(10,3),
    "referenceRangeHigh" DECIMAL(10,3),
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "interpretation" TEXT,
    "performedById" UUID NOT NULL,
    "verifiedById" UUID,
    "resultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceNo" VARCHAR(20) NOT NULL,
    "encounterId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "insuranceCoverage" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "patientBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "dueDate" DATE,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "refType" VARCHAR(50),
    "refId" UUID,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "referenceNo" VARCHAR(100),
    "receivedById" UUID NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "insuranceProvider" VARCHAR(100) NOT NULL,
    "policyNumber" VARCHAR(50) NOT NULL,
    "claimNo" VARCHAR(50),
    "submittedAmount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2),
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "refType" VARCHAR(50),
    "refId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_resource_key" ON "permissions"("module", "action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_module_resourceId_idx" ON "audit_logs"("module", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_mrn_key" ON "patients"("mrn");

-- CreateIndex
CREATE UNIQUE INDEX "patients_nrcNumber_key" ON "patients"("nrcNumber");

-- CreateIndex
CREATE INDEX "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "patients_primaryPhone_idx" ON "patients"("primaryPhone");

-- CreateIndex
CREATE INDEX "patients_dateOfBirth_idx" ON "patients"("dateOfBirth");

-- CreateIndex
CREATE INDEX "allergies_patientId_status_idx" ON "allergies"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wards_code_key" ON "wards"("code");

-- CreateIndex
CREATE INDEX "doctor_schedules_doctorId_dayOfWeek_idx" ON "doctor_schedules"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointmentNo_key" ON "appointments"("appointmentNo");

-- CreateIndex
CREATE INDEX "appointments_patientId_scheduledAt_idx" ON "appointments"("patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_doctorId_scheduledAt_idx" ON "appointments"("doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_status_scheduledAt_idx" ON "appointments"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "encounters_encounterNo_key" ON "encounters"("encounterNo");

-- CreateIndex
CREATE UNIQUE INDEX "encounters_appointmentId_key" ON "encounters"("appointmentId");

-- CreateIndex
CREATE INDEX "encounters_patientId_startTime_idx" ON "encounters"("patientId", "startTime");

-- CreateIndex
CREATE INDEX "encounters_status_idx" ON "encounters"("status");

-- CreateIndex
CREATE INDEX "vital_signs_encounterId_recordedAt_idx" ON "vital_signs"("encounterId", "recordedAt");

-- CreateIndex
CREATE INDEX "diagnoses_patientId_status_idx" ON "diagnoses"("patientId", "status");

-- CreateIndex
CREATE INDEX "diagnoses_icd10Code_idx" ON "diagnoses"("icd10Code");

-- CreateIndex
CREATE INDEX "clinical_notes_encounterId_createdAt_idx" ON "clinical_notes"("encounterId", "createdAt");

-- CreateIndex
CREATE INDEX "medical_orders_encounterId_status_idx" ON "medical_orders"("encounterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "medications_code_key" ON "medications"("code");

-- CreateIndex
CREATE INDEX "medications_genericName_idx" ON "medications"("genericName");

-- CreateIndex
CREATE INDEX "drug_inventory_medicationId_expiryDate_idx" ON "drug_inventory"("medicationId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_rxNumber_key" ON "prescriptions"("rxNumber");

-- CreateIndex
CREATE INDEX "prescriptions_status_prescribedAt_idx" ON "prescriptions"("status", "prescribedAt");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_code_key" ON "lab_tests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_orderNo_key" ON "lab_orders"("orderNo");

-- CreateIndex
CREATE INDEX "lab_orders_status_priority_idx" ON "lab_orders"("status", "priority");

-- CreateIndex
CREATE INDEX "lab_orders_patientId_idx" ON "lab_orders"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "lab_results_labOrderItemId_key" ON "lab_results"("labOrderItemId");

-- CreateIndex
CREATE INDEX "lab_results_patientId_idx" ON "lab_results"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNo_key" ON "invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "invoices_patientId_status_idx" ON "invoices"("patientId", "status");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_contacts" ADD CONSTRAINT "patient_contacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_attendingDoctorId_fkey" FOREIGN KEY ("attendingDoctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_diagnosedById_fkey" FOREIGN KEY ("diagnosedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_orders" ADD CONSTRAINT "medical_orders_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_inventory" ADD CONSTRAINT "drug_inventory_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescribedById_fkey" FOREIGN KEY ("prescribedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_labOrderItemId_fkey" FOREIGN KEY ("labOrderItemId") REFERENCES "lab_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
