import { prisma } from '../../common';
import { VisitCreateInput, VisitUpdateInput, VisitFilterOptions } from './visit.type';
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
        symptoms: data.symptoms || null,
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

      logger.info('Visit created successfully', { visitId: visit.id, requestId });
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
  async updateVisit(id: string, data: VisitUpdateInput, requestId: string): Promise<any> {
    try {
      logger.debug('Updating visit', { id, data, requestId });

      const updateData: Prisma.VisitUpdateInput = {
        ...data,
        vitals: data.vitals ? JSON.stringify(data.vitals) : undefined,
        updatedAt: new Date(),
      };

      if (data.doctorId !== undefined) {
        updateData.doctor = data.doctorId ? { connect: { id: data.doctorId } } : { disconnect: true };
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

      logger.info('Visit updated successfully', { visitId: visit.id, requestId });
      return visit;
    } catch (error) {
      logger.error('Error updating visit', { error, id, data, requestId });
      throw error;
    }
  },

  /**
   * Get visits with filtering
   */
  async getVisits(filters?: VisitFilterOptions, requestId?: string): Promise<any[]> {
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
      const hasdoctorRole = doctor.userRoles.some(ur => 
        ur.role.roleName === 'DOCTOR' || ur.role.roleName === 'STAFF'
      );
      
      return hasdoctorRole;
    } catch (error) {
      logger.error('Error validating doctor', { error, doctorId });
      return false;
    }
  },
};
