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
