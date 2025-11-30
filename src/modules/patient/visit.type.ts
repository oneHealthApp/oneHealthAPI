import { Prisma, VisitType } from '@prisma/client';

/**
 * Data types used across Visit module.
 */

/**
 * Input type for creating a new Visit.
 */
export interface VisitCreateInput {
  tenantId: string;
  clinicId: string;
  patientId: string;
  doctorId?: string | null;
  visitType?: VisitType;
  vitals?: {
    temperature?: number;
    pulse?: number;
    bp?: string;
    spo2?: number;
  } | null;
  symptoms?: string | null;
  notes?: string | null;
}

/**
 * Input type for updating an existing Visit.
 */
export interface VisitUpdateInput {
  visitType?: VisitType;
  doctorId?: string | null;
  vitals?: {
    temperature?: number;
    pulse?: number;
    bp?: string;
    spo2?: number;
  } | null;
  symptoms?: string | null;
  notes?: string | null;
  workflowState?: string;
  endedAt?: Date | null;
}

/**
 * Response type for visit creation.
 */
export interface VisitCreateResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    tenantId: string;
    clinicId: string;
    patientId: string;
    doctorId: string | null;
    visitType: VisitType;
    startedAt: Date;
    endedAt: Date | null;
    symptoms: string | null;
    vitals: any;
    notes: string | null;
    workflowState: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Filter options for visits.
 */
export interface VisitFilterOptions {
  tenantId?: string;
  clinicId?: string;
  patientId?: string;
  doctorId?: string;
  visitType?: VisitType;
  workflowState?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Input type for adding diagnosis to a visit.
 */
export interface DiagnosisInput {
  providerId?: string;
  icdCode: string;
  snomedId?: string;
  label: string;
  primary?: boolean;
  confidence?: number;
  status?: string;
  notes?: string;
}

/**
 * Input type for adding prescription to a visit.
 */
export interface PrescriptionInput {
  prescriberId?: string;
  diagnosisId?: string;
  items: {
    medicine: string;
    dose: string;
    frequency: string;
    duration: string;
  }[];
  instructions?: string;
}

/**
 * Input type for adding lab order to a visit.
 */
export interface LabOrderInput {
  tests: {
    testName: string;
    testCode?: string;
    category?: string;
    instructions?: string;
  }[];
  status?: string;
  notes?: string;
}

/**
 * Input type for adding visit details (diagnoses, prescriptions, and lab orders).
 */
export interface VisitDetailsInput {
  visitId: string;
  diagnoses?: DiagnosisInput[];
  prescriptions?: PrescriptionInput[];
  labOrders?: LabOrderInput[];
}

/**
 * Response type for visit details creation.
 */
export interface VisitDetailsResponse {
  success: boolean;
  message: string;
  data: {
    diagnoses: any[];
    prescriptions: any[];
    labOrders: any[];
  };
}
