import { prisma } from "../../common";
import { PatientCreateInput, PatientUpdateInput, PatientFilterOptions, PatientResponse, PersonCreateInput } from "./patient.type";
import { getModuleLogger, PaginationInput } from "../../utils";
import { Patient, PersonType } from "@prisma/client";

const logger = getModuleLogger("patient-repository");

/**
 * Repository layer for direct DB access (Patient entity).
 */
export const PatientRepository = {
  // Helper method to create address
  async createAddress(addressData: any, requestId: string, userId: string): Promise<string> {
    try {
      const address = await prisma.address.create({
        data: {
          ...addressData,
          createdBy: userId,
          updatedBy: userId
        }
      });
      logger.debug("Address created successfully", { address, requestId, userId });
      return address.id;
    } catch (error) {
      logger.error("Error creating Address:", { error, requestId, userId });
      throw error;
    }
  },

  // Helper method to create person
  async createPerson(personData: Omit<PersonCreateInput, 'tenantId' | 'type'>, tenantId: string, requestId: string, userId: string): Promise<string> {
    try {
      const person = await prisma.person.create({
        data: {
          ...personData,
          tenantId,
          type: PersonType.OTHER
        }
      });
      logger.debug("Person created successfully", { person, requestId, userId });
      return person.id;
    } catch (error) {
      logger.error("Error creating Person:", { error, requestId, userId });
      throw error;
    }
  },

  // Helper method to get clinic by ID for tenant derivation
  async getClinicById(clinicId: string, requestId: string, userId: string): Promise<{ tenantId: string } | null> {
    try {
      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { tenantId: true }
      });
      logger.debug("Clinic retrieved for tenant derivation", { clinicId, clinic, requestId, userId });
      return clinic;
    } catch (error) {
      logger.error("Error retrieving clinic:", { clinicId, error, requestId, userId });
      throw error;
    }
  },

  async create(data: PatientCreateInput, requestId: string, userId: string): Promise<Patient> {
    try {
      let addressId = data.addressId;
      let personId: string | undefined;
      
      // Ensure tenantId and pseudonymId are set (should be done by service layer)
      if (!data.tenantId) {
        throw new Error('tenantId is required for patient creation');
      }
      if (!data.pseudonymId) {
        throw new Error('pseudonymId is required for patient creation');
      }

      const finalTenantId = data.tenantId;
      const finalPseudonymId = data.pseudonymId;
      
      // Create address if address object is provided
      if (data.address && !addressId) {
        addressId = await this.createAddress(data.address, requestId, userId);
      }

      // Create person if person object is provided
      if (data.person) {
        personId = await this.createPerson(data.person, finalTenantId, requestId, userId);
      }
      
      const { address, person, ...patientData } = data;
      const result = await prisma.patient.create({ 
        data: {
          ...patientData,
          tenantId: finalTenantId,
          pseudonymId: finalPseudonymId,
          addressId: addressId || undefined,
          identities: personId ? {
            create: {
              personId: personId
            }
          } : undefined
        },
        include: {
          clinic: {
            select: { id: true, name: true, clinicType: true }
          },
          owner: {
            include: {
              person: {
                select: { fullName: true, phone: true, email: true }
              }
            }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          identities: {
            include: {
              person: {
                select: { 
                  id: true, 
                  fullName: true, 
                  phone: true, 
                  email: true, 
                  dateOfBirth: true, 
                  sex: true,
                  type: true
                }
              }
            }
          }
        }
      });
      logger.debug("Patient created successfully", { data, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error creating Patient:", { error, requestId, userId });
      throw error;
    }
  },

  async bulkCreate(patients: PatientCreateInput[], requestId: string, userId: string): Promise<{ count: number }> {
    try {
      // Validate and ensure required fields are set
      const validatedPatients = patients.map((patient, index) => {
        if (!patient.tenantId) {
          throw new Error(`tenantId is required for patient at index ${index}`);
        }
        if (!patient.pseudonymId) {
          throw new Error(`pseudonymId is required for patient at index ${index}`);
        }
        
        // Create a clean object with required fields
        const { address, person, ...cleanPatient } = patient;
        return {
          ...cleanPatient,
          tenantId: patient.tenantId,
          pseudonymId: patient.pseudonymId,
          addressId: patient.addressId || undefined
        };
      });

      const result = await prisma.patient.createMany({ 
        data: validatedPatients,
        skipDuplicates: true 
      });
      logger.debug("Bulk patients created successfully", { count: result.count, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error bulk creating patients:", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(filters?: PatientFilterOptions, requestId?: string, userId?: string): Promise<PatientResponse[]> {
    try {
      const whereClause: any = {};
      
      if (filters?.tenantId) whereClause.tenantId = filters.tenantId;
      if (filters?.clinicId) whereClause.clinicId = filters.clinicId;
      if (filters?.type) whereClause.type = filters.type;
      if (filters?.species) whereClause.species = filters.species;
      if (filters?.ownerId) whereClause.ownerId = filters.ownerId;
      if (filters?.hasIdentifyingInfo !== undefined) whereClause.hasIdentifyingInfo = filters.hasIdentifyingInfo;
      
      if (filters?.search) {
        whereClause.OR = [
          { pseudonymId: { contains: filters.search, mode: 'insensitive' } },
          { externalId: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const result = await prisma.patient.findMany({
        where: whereClause,
        include: {
          clinic: {
            select: { id: true, name: true, clinicType: true }
          },
          owner: {
            include: {
              person: {
                select: { fullName: true, phone: true, email: true }
              }
            }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          identities: {
            include: {
              person: {
                select: { 
                  id: true, 
                  fullName: true, 
                  phone: true, 
                  email: true, 
                  dateOfBirth: true, 
                  sex: true,
                  type: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug("Fetched all patients successfully", { result, requestId, userId });
      return result as PatientResponse[];
    } catch (error) {
      logger.error("Error fetching all patients:", { error, requestId, userId });
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
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      
      if (filters?.tenantId) whereClause.tenantId = filters.tenantId;
      if (filters?.clinicId) whereClause.clinicId = filters.clinicId;
      if (filters?.type) whereClause.type = filters.type;
      if (filters?.species) whereClause.species = filters.species;
      if (filters?.ownerId) whereClause.ownerId = filters.ownerId;
      if (filters?.hasIdentifyingInfo !== undefined) whereClause.hasIdentifyingInfo = filters.hasIdentifyingInfo;
      
      if (filters?.search) {
        whereClause.OR = [
          { pseudonymId: { contains: filters.search, mode: 'insensitive' } },
          { externalId: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [data, total] = await prisma.$transaction([
        prisma.patient.findMany({ 
          skip, 
          take: limit,
          where: whereClause,
          include: {
            clinic: {
              select: { id: true, name: true, clinicType: true }
            },
            owner: {
              include: {
                person: {
                  select: { fullName: true, phone: true, email: true }
                }
              }
            },
            address: {
              select: { id: true, address: true, town: true, state: true, countryName: true }
            },
            identities: {
              include: {
                person: {
                  select: { 
                    id: true, 
                    fullName: true, 
                    phone: true, 
                    email: true, 
                    dateOfBirth: true, 
                    sex: true,
                    type: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.patient.count({ where: whereClause }),
      ]);

      logger.debug("Fetched paginated patients successfully", {
        data,
        total,
        requestId,
        userId,
      });

      return {
        data,
        total,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error fetching paginated patients:", { error, requestId, userId });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string): Promise<PatientResponse | null> {
    try {
      const result = await prisma.patient.findUnique({ 
        where: { id },
        include: {
          clinic: {
            select: { id: true, name: true, clinicType: true }
          },
          owner: {
            include: {
              person: {
                select: { fullName: true, phone: true, email: true }
              }
            }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          identities: {
            include: {
              person: {
                select: { 
                  id: true, 
                  fullName: true, 
                  phone: true, 
                  email: true, 
                  dateOfBirth: true, 
                  sex: true,
                  type: true
                }
              }
            }
          },
          visits: {
            select: { id: true, startedAt: true, endedAt: true, visitType: true }
          },
          vaccinations: {
            select: { id: true, vaccineName: true, givenAt: true, nextDueAt: true }
          }
        }
      });
      logger.debug("Fetched Patient by ID successfully", { id, result, requestId, userId });
      return result as PatientResponse;
    } catch (error) {
      logger.error("Error fetching Patient by ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async getByPseudonymId(pseudonymId: string, requestId: string, userId: string): Promise<PatientResponse | null> {
    try {
      const result = await prisma.patient.findUnique({ 
        where: { pseudonymId },
        include: {
          clinic: {
            select: { id: true, name: true, clinicType: true }
          },
          owner: {
            include: {
              person: {
                select: { fullName: true, phone: true, email: true }
              }
            }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          identities: {
            include: {
              person: {
                select: { 
                  id: true, 
                  fullName: true, 
                  phone: true, 
                  email: true, 
                  dateOfBirth: true, 
                  sex: true,
                  type: true
                }
              }
            }
          },
          visits: {
            select: { id: true, startedAt: true, endedAt: true, visitType: true }
          },
          vaccinations: {
            select: { id: true, vaccineName: true, givenAt: true, nextDueAt: true }
          }
        }
      });
      logger.debug("Fetched Patient by pseudonym ID successfully", { pseudonymId, result, requestId, userId });
      return result as PatientResponse;
    } catch (error) {
      logger.error("Error fetching Patient by pseudonym ID:", { pseudonymId, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: PatientUpdateInput, requestId: string, userId: string): Promise<PatientResponse> {
    try {
      let addressId = data.addressId;
      
      // Create or update address if address object is provided
      if (data.address && !addressId) {
        // Get existing patient to check if it has an address
        const existingPatient = await prisma.patient.findUnique({ 
          where: { id },
          select: { addressId: true }
        });
        
        if (existingPatient?.addressId) {
          // Update existing address
          await prisma.address.update({
            where: { id: existingPatient.addressId },
            data: {
              ...data.address,
              updatedBy: userId
            }
          });
          addressId = existingPatient.addressId;
        } else {
          // Create new address
          addressId = await this.createAddress(data.address, requestId, userId);
        }
      }

      // Handle person creation/update if person object is provided
      if (data.person) {
        // Get existing patient to check if it has a person through identities
        const existingPatient = await prisma.patient.findUnique({ 
          where: { id },
          include: { identities: true }
        });
        
        if (existingPatient?.identities?.personId) {
          // Update existing person
          await prisma.person.update({
            where: { id: existingPatient.identities.personId },
            data: data.person
          });
        } else {
          // Create new person and link through identities
          const personId = await this.createPerson(data.person, data.tenantId || existingPatient?.tenantId || '', requestId, userId);
          
          // Create or update the patient identity relationship
          await prisma.patientIdentity.upsert({
            where: { patientId: id },
            create: { patientId: id, personId },
            update: { personId }
          });
        }
      }
      
      const { address, person, ...patientData } = data;
      const result = await prisma.patient.update({ 
        where: { id }, 
        data: {
          ...patientData,
          ...(addressId && { addressId })
        },
        include: {
          clinic: {
            select: { id: true, name: true, clinicType: true }
          },
          owner: {
            include: {
              person: {
                select: { fullName: true, phone: true, email: true }
              }
            }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          identities: {
            select: { id: true, nameCipher: true, phoneCipher: true, emailCipher: true }
          }
        }
      });
      logger.debug("Updated Patient successfully", { id, data, result, requestId, userId });
      return result as PatientResponse;
    } catch (error) {
      logger.error("Error updating Patient with ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string): Promise<Patient> {
    try {
      const result = await prisma.patient.delete({ where: { id } });
      logger.debug("Deleted Patient successfully", { id, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error deleting Patient with ID:", { id, error, requestId, userId });
      throw error;
    }
  },
};