import { ClinicCreateInput, ClinicUpdateInput, ClinicFilterOptions } from "./clinic.type";
import { ClinicRepository } from "./clinic.repository";
import { getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("clinic-service");

/**
 * Business logic layer for Clinic operations.
 */
export const ClinicService = {
  async create(data: ClinicCreateInput, requestId: string, userId: string) {
    try {
      logger.debug("Creating Clinic", { data, requestId, userId });
      
      // Business logic validations
      if (!data.name || data.name.trim().length < 2) {
        throw new Error('Clinic name must be at least 2 characters long');
      }

      // Validate tenant requirements
      if (!data.tenantId && !data.tenantName) {
        // If no tenantId and no tenantName provided, use clinic name as tenant name
        data.tenantName = data.name;
      }
      
      if (data.tenantName && data.tenantName.trim().length < 2) {
        throw new Error('Tenant name must be at least 2 characters long');
      }

      // Validate address requirements
      if (data.address && data.addressId) {
        throw new Error('Cannot provide both addressId and address object');
      }
      
      // Check if clinic with same name exists for the tenant (if tenantId provided)
      if (data.tenantId) {
        const existingClinic = await ClinicRepository.getByTenantAndName(
          data.tenantId, 
          data.name.trim(), 
          requestId, 
          userId
        );
        if (existingClinic) {
          throw new Error('Clinic with this name already exists for this tenant');
        }
      }
      // Note: If creating new tenant, clinic name uniqueness will be checked after tenant creation
      
      return await ClinicRepository.create(data, requestId, userId);
    } catch (error) {
      logger.error("Error creating Clinic", { error, requestId, userId });
      throw error;
    }
  },

  async bulkCreate(clinics: ClinicCreateInput[], requestId: string, userId: string) {
    try {
      logger.debug("Bulk creating Clinics", { count: clinics.length, requestId, userId });
      
      // Validate each clinic data
      for (const clinic of clinics) {
        if (!clinic.name || clinic.name.trim().length < 2) {
          throw new Error(`Clinic name '${clinic.name}' must be at least 2 characters long`);
        }
      }
      
      return await ClinicRepository.bulkCreate(clinics, requestId, userId);
    } catch (error) {
      logger.error("Error bulk creating clinics", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(filters?: ClinicFilterOptions, requestId?: string, userId?: string) {
    try {
      logger.debug("Fetching all clinics", { filters, requestId, userId });
      return await ClinicRepository.getAll(filters, requestId, userId);
    } catch (error) {
      logger.error("Error fetching all clinics", { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(
    pagination: PaginationInput, 
    filters?: ClinicFilterOptions,
    requestId?: string, 
    userId?: string
  ) {
    try {
      logger.debug("Fetching paginated clinics", {
        pagination,
        filters,
        requestId,
        userId,
      });
      return await ClinicRepository.getPaginated(pagination, filters, requestId, userId);
    } catch (error) {
      logger.error("Error fetching paginated clinics", {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      return await ClinicRepository.get(id, requestId, userId);
    } catch (error) {
      logger.error("Error fetching Clinic by ID", { id, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: ClinicUpdateInput, requestId: string, userId: string) {
    try {
      const exists = await ClinicRepository.get(id, requestId, userId);
      if (!exists) return null;
      
      // Business logic validations for updates
      if (data.name !== undefined && (!data.name || data.name.trim().length < 2)) {
        throw new Error('Clinic name must be at least 2 characters long');
      }

      // Validate address requirements
      if (data.address && data.addressId) {
        throw new Error('Cannot provide both addressId and address object');
      }
      
      // Check name uniqueness if it's being updated
      if (data.name && data.name !== exists.name) {
        const existingClinic = await ClinicRepository.getByTenantAndName(
          data.tenantId || exists.tenantId, 
          data.name.trim(), 
          requestId, 
          userId
        );
        if (existingClinic && existingClinic.id !== id) {
          throw new Error('Clinic with this name already exists for this tenant');
        }
      }
      
      logger.debug("Updating Clinic", { id, data, requestId, userId });
      return await ClinicRepository.update(id, data, requestId, userId);
    } catch (error) {
      logger.error("Error updating Clinic", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const exists = await ClinicRepository.get(id, requestId, userId);
      if (!exists) return null;
      
      // Business logic: Check if clinic has any patients or appointments before deletion
      if (exists._count && (exists._count.patients > 0 || exists._count.appointments > 0)) {
        throw new Error('Cannot delete clinic that has patients or appointments. Please transfer or remove them first.');
      }
      
      logger.debug("Deleting Clinic", { id, requestId, userId });
      return await ClinicRepository.delete(id, requestId, userId);
    } catch (error) {
      logger.error("Error deleting Clinic", { id, error, requestId, userId });
      throw error;
    }
  },
};