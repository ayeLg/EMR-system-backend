-- Sequence backing auto-generated patient MRNs (`MRN-` + 7-digit zero-padded value).
-- Used by PatientsService.generateMrn() via SELECT nextval('patient_mrn_seq').
CREATE SEQUENCE IF NOT EXISTS patient_mrn_seq START WITH 1 INCREMENT BY 1;
