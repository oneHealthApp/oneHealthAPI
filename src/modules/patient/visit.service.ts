import { VisitCreateInput, VisitUpdateInput, VisitCreateResponse, VisitFilterOptions } from './visit.type';
import { VisitRepository } from './visit.repository';
import { getModuleLogger } from '../../utils';

const logger = getModuleLogger('visit-service');

/**
 * Business logic layer for Visit operations.
 */
export const VisitService = {
  /**
   * Create a new visit
   */
  async createVisit(input: VisitCreateInput, requestId: string, userId: string): Promise<VisitCreateResponse> {
    try {
      logger.debug('Creating visit', { input, requestId, userId });

      // Validate required entities exist
      const tenantValid = await VisitRepository.validateTenant(input.tenantId);
      if (!tenantValid) {
        throw new Error('Invalid tenant ID');
      }

      const clinicValid = await VisitRepository.validateClinic(input.clinicId);
      if (!clinicValid) {
        throw new Error('Invalid clinic ID');
      }

      const patientValid = await VisitRepository.validatePatient(input.patientId);
      if (!patientValid) {
        throw new Error('Invalid patient ID');
      }

      // Validate doctor if provided
      if (input.doctorId) {
        const doctorValid = await VisitRepository.validateDoctor(input.doctorId);
        if (!doctorValid) {
          throw new Error('Invalid doctor ID or doctor does not have appropriate role');
        }
      }

      // Create the visit
      const visit = await VisitRepository.createVisit(input, requestId);

      logger.info('Visit created successfully', {
        visitId: visit.id,
        patientId: input.patientId,
        clinicId: input.clinicId,
        requestId,
        userId,
      });

      return {
        success: true,
        message: 'Visit created successfully',
        data: {
          id: visit.id,
          tenantId: visit.tenantId,
          clinicId: visit.clinicId,
          patientId: visit.patientId,
          doctorId: visit.doctorId,
          visitType: visit.visitType,
          startedAt: visit.startedAt,
          endedAt: visit.endedAt,
          symptoms: visit.symptoms,
          vitals: visit.vitals ? JSON.parse(visit.vitals) : null,
          notes: visit.notes,
          workflowState: visit.workflowState,
          createdAt: visit.createdAt,
          updatedAt: visit.updatedAt,
        },
      };
    } catch (error) {
      logger.error('Error creating visit', {
        error,
        input,
        requestId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get visit by ID
   */
  async getVisitById(id: string, requestId: string, userId: string) {
    try {
      logger.debug('Fetching visit by ID', { id, requestId, userId });

      const visit = await VisitRepository.getVisitById(id, requestId);
      if (!visit) {
        throw new Error('Visit not found');
      }

      return {
        ...visit,
        vitals: visit.vitals ? JSON.parse(visit.vitals) : null,
      };
    } catch (error) {
      logger.error('Error fetching visit by ID', { error, id, requestId, userId });
      throw error;
    }
  },

  /**
   * Update visit
   */
  async updateVisit(id: string, input: VisitUpdateInput, requestId: string, userId: string) {
    try {
      logger.debug('Updating visit', { id, input, requestId, userId });

      // Check if visit exists
      const existingVisit = await VisitRepository.getVisitById(id, requestId);
      if (!existingVisit) {
        throw new Error('Visit not found');
      }

      // Validate doctor if provided
      if (input.doctorId) {
        const doctorValid = await VisitRepository.validateDoctor(input.doctorId);
        if (!doctorValid) {
          throw new Error('Invalid doctor ID or doctor does not have appropriate role');
        }
      }

      // Update the visit
      const updatedVisit = await VisitRepository.updateVisit(id, input, requestId);

      logger.info('Visit updated successfully', {
        visitId: updatedVisit.id,
        requestId,
        userId,
      });

      return {
        ...updatedVisit,
        vitals: updatedVisit.vitals ? JSON.parse(updatedVisit.vitals) : null,
      };
    } catch (error) {
      logger.error('Error updating visit', {
        error,
        id,
        input,
        requestId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get visits with filtering
   */
  async getVisits(filters: VisitFilterOptions, requestId: string, userId: string) {
    try {
      logger.debug('Fetching visits with filters', { filters, requestId, userId });

      const visits = await VisitRepository.getVisits(filters, requestId);

      // Parse vitals JSON for each visit
      const parsedVisits = visits.map(visit => ({
        ...visit,
        vitals: visit.vitals ? JSON.parse(visit.vitals) : null,
      }));

      logger.info('Visits fetched successfully', {
        count: parsedVisits.length,
        filters,
        requestId,
        userId,
      });

      return parsedVisits;
    } catch (error) {
      logger.error('Error fetching visits', {
        error,
        filters,
        requestId,
        userId,
      });
      throw error;
    }
  },
};
