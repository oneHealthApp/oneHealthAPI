import { PatientCreateInput, PatientUpdateInput, PatientFilterOptions } from "./patient.type";
import { PatientRepository } from "./patient.repository";
import { getModuleLogger, PaginationInput } from "../../utils";

const logger = getModuleLogger("patient-service");

/**
 * Business logic layer for Patient operations.
 */
export const PatientService = {
  async create(data: PatientCreateInput, requestId: string, userId: string) {
    try {
      logger.debug("Creating Patient", { data, requestId, userId });
      
      // Derive tenantId from clinicId if not provided
      let tenantId = data.tenantId;
      if (!tenantId && data.clinicId) {
        // Get clinic to derive tenant
        const clinic = await PatientRepository.getClinicById(data.clinicId, requestId, userId);
        if (!clinic) {
          throw new Error('Clinic not found');
        }
        tenantId = clinic.tenantId;
      }
      
      if (!tenantId) {
        throw new Error('TenantId is required or must be derivable from clinic');
      }
      
      // Business logic validations
      if (data.type === 'HUMAN' && data.species) {
        throw new Error('Human patients cannot have a species');
      }
      
      if ((data.type === 'PET' || data.type === 'LIVESTOCK') && !data.species) {
        throw new Error('Animal patients must have a species');
      }
      
      // Validate address requirements
      if (data.address && data.addressId) {
        throw new Error('Cannot provide both addressId and address object');
      }

      // Validate person requirements
      if (data.person) {
        // Basic person validation
        if (data.person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.person.email)) {
          throw new Error('Invalid email format');
        }
        if (data.person.phone && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(data.person.phone)) {
          throw new Error('Invalid phone number format');
        }
        if (data.person.dateOfBirth) {
          const dob = new Date(data.person.dateOfBirth);
          if (isNaN(dob.getTime()) || dob > new Date()) {
            throw new Error('Invalid date of birth');
          }
        }
      }
      
      // Generate pseudonymId if not provided
      let pseudonymId = data.pseudonymId;
      if (!pseudonymId) {
        // Generate a unique pseudonymId
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        pseudonymId = `PAT-${timestamp}-${random}`;
      }
      
      // Ensure pseudonymId is unique
      const existingPatient = await PatientRepository.getByPseudonymId(pseudonymId, requestId, userId);
      if (existingPatient) {
        // If auto-generated ID exists, try with a different random number
        const newRandom = Math.floor(Math.random() * 10000);
        pseudonymId = `PAT-${Date.now()}-${newRandom}`;
      }
      
      // Add pseudonymId and tenantId to the data
      const patientData = { ...data, pseudonymId, tenantId };
      
      return await PatientRepository.create(patientData, requestId, userId);
    } catch (error) {
      logger.error("Error creating Patient", { error, requestId, userId });
      throw error;
    }
  },

  async bulkCreate(patients: PatientCreateInput[], requestId: string, userId: string) {
    try {
      logger.debug("Bulk creating Patients", { count: patients.length, requestId, userId });
      
      // Validate each patient data
      for (const patient of patients) {
        if (patient.type === 'HUMAN' && patient.species) {
          throw new Error(`Human patient with pseudonym ${patient.pseudonymId} cannot have a species`);
        }
        
        if ((patient.type === 'PET' || patient.type === 'LIVESTOCK') && !patient.species) {
          throw new Error(`Animal patient with pseudonym ${patient.pseudonymId} must have a species`);
        }
        
        // Validate address requirements
        if (patient.address && patient.addressId) {
          throw new Error(`Patient with pseudonym ${patient.pseudonymId} cannot provide both addressId and address object`);
        }
      }
      
      return await PatientRepository.bulkCreate(patients, requestId, userId);
    } catch (error) {
      logger.error("Error bulk creating patients", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(filters?: PatientFilterOptions, requestId?: string, userId?: string) {
    try {
      logger.debug("Fetching all patients", { filters, requestId, userId });
      return await PatientRepository.getAll(filters, requestId, userId);
    } catch (error) {
      logger.error("Error fetching all patients", { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(
    pagination: PaginationInput, 
    filters?: PatientFilterOptions,
    requestId?: string, 
    userId?: string
  ) {
    try {
      logger.debug("Fetching paginated patients", {
        pagination,
        filters,
        requestId,
        userId,
      });
      return await PatientRepository.getPaginated(pagination, filters, requestId, userId);
    } catch (error) {
      logger.error("Error fetching paginated patients", {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      return await PatientRepository.get(id, requestId, userId);
    } catch (error) {
      logger.error("Error fetching Patient by ID", { id, error, requestId, userId });
      throw error;
    }
  },

  async getByPseudonymId(pseudonymId: string, requestId: string, userId: string) {
    try {
      return await PatientRepository.getByPseudonymId(pseudonymId, requestId, userId);
    } catch (error) {
      logger.error("Error fetching Patient by pseudonym ID", { pseudonymId, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: PatientUpdateInput, requestId: string, userId: string) {
    try {
      const exists = await PatientRepository.get(id, requestId, userId);
      if (!exists) return null;
      
      // Business logic validations for updates
      if (data.type === 'HUMAN' && data.species) {
        throw new Error('Human patients cannot have a species');
      }
      
      if ((data.type === 'PET' || data.type === 'LIVESTOCK') && data.species === undefined) {
        // Only throw error if type is being changed to animal but species is explicitly set to undefined
        if (data.type !== exists.type) {
          throw new Error('Animal patients must have a species');
        }
      }
      
      // Validate address requirements
      if (data.address && data.addressId) {
        throw new Error('Cannot provide both addressId and address object');
      }

      // Validate person requirements
      if (data.person) {
        // Basic person validation
        if (data.person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.person.email)) {
          throw new Error('Invalid email format');
        }
        if (data.person.phone && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(data.person.phone)) {
          throw new Error('Invalid phone number format');
        }
        if (data.person.dateOfBirth) {
          const dob = new Date(data.person.dateOfBirth);
          if (isNaN(dob.getTime()) || dob > new Date()) {
            throw new Error('Invalid date of birth');
          }
        }
      }
      
      // Check pseudonymId uniqueness if it's being updated
      if (data.pseudonymId && data.pseudonymId !== exists.pseudonymId) {
        const existingPatient = await PatientRepository.getByPseudonymId(data.pseudonymId, requestId, userId);
        if (existingPatient && existingPatient.id !== id) {
          throw new Error('Patient with this pseudonym ID already exists');
        }
      }
      
      logger.debug("Updating Patient", { id, data, requestId, userId });
      return await PatientRepository.update(id, data, requestId, userId);
    } catch (error) {
      logger.error("Error updating Patient", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const exists = await PatientRepository.get(id, requestId, userId);
      if (!exists) return null;
      
      // Business logic: Check if patient has any visits or appointments before deletion
      // This would require additional checks in the repository layer
      logger.debug("Deleting Patient", { id, requestId, userId });
      return await PatientRepository.delete(id, requestId, userId);
    } catch (error) {
      logger.error("Error deleting Patient", { id, error, requestId, userId });
      throw error;
    }
  },
};