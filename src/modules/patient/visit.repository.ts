import { prisma } from '../../common';
import {
  VisitCreateInput,
  VisitUpdateInput,
  VisitFilterOptions,
} from './visit.type';
import { getModuleLogger } from '../../utils';
import { VisitType, Prisma } from '@prisma/client';

const logger = getModuleLogger('visit-repository');

/**
 * Database operations for Visit management.
 */
export const VisitRepository = {
  /**
   * Create a new visit record
   */
  async createVisit(data: VisitCreateInput, requestId: string): Promise<any> {
    try {
      logger.debug('Creating visit', { data, requestId });

      const visitData: Prisma.VisitCreateInput = {
        tenant: { connect: { id: data.tenantId } },
        clinic: { connect: { id: data.clinicId } },
        patient: { connect: { id: data.patientId } },
        doctor: data.doctorId ? { connect: { id: data.doctorId } } : undefined,
        visitType: data.visitType || VisitType.CLINIC,
        vitals: data.vitals ? JSON.stringify(data.vitals) : undefined,
        symptoms: data.symptoms ?? undefined,
        notes: data.notes || null,
        workflowState: 'OPEN',
        startedAt: new Date(),
        endedAt: null,
      };

      const visit = await prisma.visit.create({
        data: visitData,
        include: {
          patient: {
            select: {
              id: true,
              pseudonymId: true,
              type: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              emailId: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info('Visit created successfully', {
        visitId: visit.id,
        requestId,
      });
      return visit;
    } catch (error) {
      logger.error('Error creating visit', { error, data, requestId });
      throw error;
    }
  },

  /**
   * Get visit by ID
   */
  async getVisitById(id: string, requestId: string): Promise<any | null> {
    try {
      logger.debug('Fetching visit by ID', { id, requestId });

      const visit = await prisma.visit.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              pseudonymId: true,
              type: true,
              age: true,
              sex: true,
              species: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              emailId: true,
              person: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              clinicType: true,
            },
          },
          diagnoses: true,
          prescriptions: true,
          labOrders: true,
        },
      });

      return visit;
    } catch (error) {
      logger.error('Error fetching visit by ID', { error, id, requestId });
      throw error;
    }
  },

  /**
   * Update visit
   */
  async updateVisit(
    id: string,
    data: VisitUpdateInput,
    requestId: string,
  ): Promise<any> {
    try {
      logger.debug('Updating visit', { id, data, requestId });

      const updateData: Prisma.VisitUpdateInput = {
        ...data,

        vitals: data.vitals ?? Prisma.JsonNull,
        symptoms: data.symptoms ?? null,

        updatedAt: new Date(),
      };

      if (data.doctorId !== undefined) {
        updateData.doctor = data.doctorId
          ? { connect: { id: data.doctorId } }
          : { disconnect: true };
      }

      const visit = await prisma.visit.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: {
              id: true,
              pseudonymId: true,
              type: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              emailId: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info('Visit updated successfully', {
        visitId: visit.id,
        requestId,
      });
      return visit;
    } catch (error) {
      logger.error('Error updating visit', { error, id, data, requestId });
      throw error;
    }
  },

  /**
   * Get visits with filtering
   */
  async getVisits(
    filters?: VisitFilterOptions,
    requestId?: string,
  ): Promise<any[]> {
    try {
      logger.debug('Fetching visits with filters', { filters, requestId });

      const where: Prisma.VisitWhereInput = {};

      if (filters) {
        if (filters.tenantId) where.tenantId = filters.tenantId;
        if (filters.clinicId) where.clinicId = filters.clinicId;
        if (filters.patientId) where.patientId = filters.patientId;
        if (filters.doctorId) where.doctorId = filters.doctorId;
        if (filters.visitType) where.visitType = filters.visitType;
        if (filters.workflowState) where.workflowState = filters.workflowState;

        if (filters.startDate || filters.endDate) {
          where.startedAt = {};
          if (filters.startDate) where.startedAt.gte = filters.startDate;
          if (filters.endDate) where.startedAt.lte = filters.endDate;
        }
      }

      const visits = await prisma.visit.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              pseudonymId: true,
              type: true,
              age: true,
              sex: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              emailId: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      return visits;
    } catch (error) {
      logger.error('Error fetching visits', { error, filters, requestId });
      throw error;
    }
  },

  /**
   * Validate if tenant exists
   */
  async validateTenant(tenantId: string): Promise<boolean> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId, isActive: true },
      });
      return !!tenant;
    } catch (error) {
      logger.error('Error validating tenant', { error, tenantId });
      return false;
    }
  },

  /**
   * Validate if clinic exists
   */
  async validateClinic(clinicId: string): Promise<boolean> {
    try {
      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId, isActive: true },
      });
      return !!clinic;
    } catch (error) {
      logger.error('Error validating clinic', { error, clinicId });
      return false;
    }
  },

  /**
   * Validate if patient exists
   */
  async validatePatient(patientId: string): Promise<boolean> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
      return !!patient;
    } catch (error) {
      logger.error('Error validating patient', { error, patientId });
      return false;
    }
  },

  /**
   * Validate if doctor exists
   */
  async validateDoctor(doctorId: string): Promise<boolean> {
    try {
      const doctor = await prisma.user.findUnique({
        where: { id: doctorId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!doctor) return false;

      // Check if user has DOCTOR role
      const hasdoctorRole = doctor.userRoles.some(
        (ur) => ur.role.roleName === 'DOCTOR' || ur.role.roleName === 'STAFF',
      );

      return hasdoctorRole;
    } catch (error) {
      logger.error('Error validating doctor', { error, doctorId });
      return false;
    }
  },

  /**
   * Find visit by ID for details operations
   */
  async findVisitById(visitId: string, requestId: string): Promise<any | null> {
    try {
      logger.debug('Finding visit by ID for details', { visitId, requestId });

      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        select: {
          id: true,
          tenantId: true,
          clinicId: true,
          patientId: true,
          doctorId: true,
          workflowState: true,
        },
      });

      return visit;
    } catch (error) {
      logger.error('Error finding visit by ID', { error, visitId, requestId });
      throw error;
    }
  },

  /**
   * Insert multiple diagnoses for a visit
   */
  async insertDiagnoses(
    visitId: string,
    diagnoses: any[],
    requestId: string,
  ): Promise<any[]> {
    try {
      logger.debug('Inserting diagnoses', {
        visitId,
        count: diagnoses.length,
        requestId,
      });

      const diagnosisData = diagnoses.map((diagnosis) => ({
        visitId,
        providerId: diagnosis.providerId || null,
        icdCode: diagnosis.icdCode,
        snomedId: diagnosis.snomedId || null,
        label: diagnosis.label,
        primary: diagnosis.primary || false,
        confidence: diagnosis.confidence || null,
        status: diagnosis.status || null,
        notes: diagnosis.notes || null,
      }));

      const result = await prisma.diagnosis.createMany({
        data: diagnosisData,
      });

      // Get the created diagnoses
      const createdDiagnoses = await prisma.diagnosis.findMany({
        where: {
          visitId,
          createdAt: {
            gte: new Date(Date.now() - 1000), // Get diagnoses created in the last second
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: diagnoses.length,
      });

      logger.info('Diagnoses inserted successfully', {
        visitId,
        count: result.count,
        requestId,
      });

      return createdDiagnoses;
    } catch (error) {
      logger.error('Error inserting diagnoses', {
        error,
        visitId,
        diagnoses,
        requestId,
      });
      throw error;
    }
  },

  /**
   * Insert multiple prescriptions for a visit
   */
  async insertPrescriptions(
    visitId: string,
    prescriptions: any[],
    requestId: string,
  ): Promise<any[]> {
    try {
      logger.debug('Inserting prescriptions', {
        visitId,
        count: prescriptions.length,
        requestId,
      });

      const prescriptionData = prescriptions.map((prescription) => ({
        visitId,
        prescriberId: prescription.prescriberId || null,
        diagnosisId: prescription.diagnosisId || null,
        items: JSON.stringify(prescription.items),
        instructions: prescription.instructions || null,
      }));

      const result = await prisma.prescription.createMany({
        data: prescriptionData,
      });

      // Get the created prescriptions
      const createdPrescriptions = await prisma.prescription.findMany({
        where: {
          visitId,
          createdAt: {
            gte: new Date(Date.now() - 1000), // Get prescriptions created in the last second
          },
        },
        include: {
          prescriber: {
            select: {
              id: true,
              username: true,
              emailId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: prescriptions.length,
      });

      // Parse items JSON back to objects
      const parsedPrescriptions = createdPrescriptions.map((prescription) => ({
        ...prescription,
        items: JSON.parse(prescription.items as string),
      }));

      logger.info('Prescriptions inserted successfully', {
        visitId,
        count: result.count,
        requestId,
      });

      return parsedPrescriptions;
    } catch (error) {
      logger.error('Error inserting prescriptions', {
        error,
        visitId,
        prescriptions,
        requestId,
      });
      throw error;
    }
  },

  /**
   * Insert multiple lab orders for a visit
   */
  async insertLabOrders(
    visitId: string,
    labOrders: any[],
    requestId: string,
  ): Promise<any[]> {
    try {
      logger.debug('Inserting lab orders', {
        visitId,
        count: labOrders.length,
        requestId,
      });

      const labOrderData = labOrders.map((labOrder) => ({
        visitId,
        tests: JSON.stringify(labOrder.tests),
        status: labOrder.status || 'PENDING',
        results: labOrder.results ? JSON.stringify(labOrder.results) : Prisma.JsonNull,
      }));

      const result = await prisma.labOrder.createMany({
        data: labOrderData,
      });

      // Get the created lab orders
      const createdLabOrders = await prisma.labOrder.findMany({
        where: {
          visitId,
          createdAt: {
            gte: new Date(Date.now() - 1000), // Get lab orders created in the last second
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: labOrders.length,
      });

      // Parse tests JSON back to objects
      const parsedLabOrders = createdLabOrders.map((labOrder) => ({
        ...labOrder,
        tests: JSON.parse(labOrder.tests as string),
        results: labOrder.results ? JSON.parse(labOrder.results as string) : null,
      }));

      logger.info('Lab orders inserted successfully', {
        visitId,
        count: result.count,
        requestId,
      });

      return parsedLabOrders;
    } catch (error) {
      logger.error('Error inserting lab orders', {
        error,
        visitId,
        labOrders,
        requestId,
      });
      throw error;
    }
  },

  /**
   * Get ongoing visits for a specific clinic (where endedAt is null)
   */
  async getOngoingVisitsByClinic(
    clinicId: string,
    requestId: string,
  ): Promise<any[]> {
    try {
      logger.debug('Fetching ongoing visits by clinic ID', { clinicId, requestId });

      const visits = await prisma.visit.findMany({
        where: {
          clinicId,
          endedAt: null, // Only ongoing visits
        },
        include: {
          patient: {
            select: {
              id: true,
              pseudonymId: true,
              type: true,
              age: true,
              sex: true,
              species: true,
            },
          },
          doctor: {
            select: {
              id: true,
              username: true,
              emailId: true,
              person: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              clinicType: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc', // Most recent visits first
        },
      });

      logger.info('Ongoing visits fetched successfully', {
        clinicId,
        count: visits.length,
        requestId,
      });

      return visits;
    } catch (error) {
      logger.error('Error fetching ongoing visits by clinic', {
        error,
        clinicId,
        requestId,
      });
      throw error;
    }
  },
};
