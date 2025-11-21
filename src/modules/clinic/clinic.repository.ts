import { prisma } from "../../common";
import { ClinicCreateInput, ClinicUpdateInput, ClinicFilterOptions, ClinicResponse } from "./clinic.type";
import { getModuleLogger, PaginationInput } from "../../utils";
import { Clinic } from "@prisma/client";

const logger = getModuleLogger("clinic-repository");

/**
 * Repository layer for direct DB access (Clinic entity).
 */
export const ClinicRepository = {
  // Helper method to create tenant
  async createTenant(tenantName: string, tenantSlug?: string, requestId?: string, userId?: string): Promise<string> {
    try {
      const slug = tenantSlug || tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if slug already exists
      const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
      if (existingTenant) {
        throw new Error(`Tenant with slug '${slug}' already exists`);
      }
      
      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug: slug,
          isActive: true
        }
      });
      logger.debug("Tenant created successfully", { tenant, requestId, userId });
      return tenant.id;
    } catch (error) {
      logger.error("Error creating Tenant:", { error, requestId, userId });
      throw error;
    }
  },

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

  async create(data: ClinicCreateInput, requestId: string, userId: string): Promise<Clinic> {
    try {
      let tenantId = data.tenantId;
      let addressId = data.addressId;
      
      // Create tenant if tenantId not provided
      if (!tenantId) {
        // Use tenantName if provided, otherwise use clinic name as tenant name
        const tenantName = data.tenantName || data.name;
        tenantId = await this.createTenant(tenantName, data.tenantSlug, requestId, userId);
      }
      
      // Create address if address object is provided
      if (data.address && !addressId) {
        addressId = await this.createAddress(data.address, requestId, userId);
      }
      
      const { address, tenantName, tenantSlug, ...clinicData } = data;
      const result = await prisma.clinic.create({ 
        data: {
          ...clinicData,
          tenantId,
          addressId
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          doctors: {
            select: {
              id: true,
              roleInClinic: true,
              user: {
                select: { id: true, username: true, emailId: true }
              }
            }
          },
          settings: {
            select: { id: true, timezone: true, offlineAllowed: true, defaultLanguage: true }
          },
          _count: {
            select: { patients: true, appointments: true, visits: true }
          }
        }
      });
      logger.debug("Clinic created successfully", { data, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error creating Clinic:", { error, requestId, userId });
      throw error;
    }
  },

  async bulkCreate(clinics: ClinicCreateInput[], requestId: string, userId: string): Promise<{ count: number }> {
    try {
      // Ensure all clinics have required fields for bulk creation
      const clinicData = await Promise.all(
        clinics.map(async (clinic) => {
          let finalTenantId = clinic.tenantId;
          
          // Auto-create tenant if not provided
          if (!finalTenantId && clinic.name) {
            const tenantId = await this.createTenant(clinic.name, requestId);
            finalTenantId = tenantId;
          }
          
          if (!finalTenantId) {
            throw new Error("Tenant ID is required for clinic creation");
          }
          
          return {
            name: clinic.name,
            clinicType: clinic.clinicType || 'HUMAN', // Default to HUMAN if not provided
            phone: clinic.phone,
            email: clinic.email,
            addressId: clinic.addressId,
            tenantId: finalTenantId,
            isActive: clinic.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        })
      );

      const result = await prisma.clinic.createMany({ 
        data: clinicData,
        skipDuplicates: true 
      });
      logger.debug("Bulk clinics created successfully", { count: result.count, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error bulk creating clinics:", { error, requestId, userId });
      throw error;
    }
  },

  async getAll(filters?: ClinicFilterOptions, requestId?: string, userId?: string): Promise<ClinicResponse[]> {
    try {
      const whereClause: any = {};
      
      if (filters?.tenantId) whereClause.tenantId = filters.tenantId;
      if (filters?.clinicType) whereClause.clinicType = filters.clinicType;
      if (filters?.isActive !== undefined) whereClause.isActive = filters.isActive;
      
      if (filters?.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const result = await prisma.clinic.findMany({
        where: whereClause,
        include: {
          tenant: {
            select: { id: true, name: true, slug: true }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          doctors: {
            select: {
              id: true,
              roleInClinic: true,
              user: {
                select: { id: true, username: true, emailId: true }
              }
            }
          },
          settings: {
            select: { id: true, timezone: true, offlineAllowed: true, defaultLanguage: true }
          },
          _count: {
            select: { patients: true, appointments: true, visits: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug("Fetched all clinics successfully", { result, requestId, userId });
      return result as ClinicResponse[];
    } catch (error) {
      logger.error("Error fetching all clinics:", { error, requestId, userId });
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
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      
      if (filters?.tenantId) whereClause.tenantId = filters.tenantId;
      if (filters?.clinicType) whereClause.clinicType = filters.clinicType;
      if (filters?.isActive !== undefined) whereClause.isActive = filters.isActive;
      
      if (filters?.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [data, total] = await prisma.$transaction([
        prisma.clinic.findMany({ 
          skip, 
          take: limit,
          where: whereClause,
          include: {
            tenant: {
              select: { id: true, name: true, slug: true }
            },
            address: {
              select: { id: true, address: true, town: true, state: true, countryName: true }
            },
            doctors: {
              select: {
                id: true,
                roleInClinic: true,
                user: {
                  select: { id: true, username: true, emailId: true }
                }
              }
            },
            settings: {
              select: { id: true, timezone: true, offlineAllowed: true, defaultLanguage: true }
            },
            _count: {
              select: { patients: true, appointments: true, visits: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.clinic.count({ where: whereClause }),
      ]);

      logger.debug("Fetched paginated clinics successfully", {
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
      logger.error("Error fetching paginated clinics:", { error, requestId, userId });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string): Promise<ClinicResponse | null> {
    try {
      const result = await prisma.clinic.findUnique({ 
        where: { id },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          doctors: {
            select: {
              id: true,
              roleInClinic: true,
              user: {
                select: { id: true, username: true, emailId: true }
              }
            }
          },
          settings: {
            select: { id: true, timezone: true, offlineAllowed: true, defaultLanguage: true }
          },
          _count: {
            select: { patients: true, appointments: true, visits: true }
          },
          patients: {
            take: 5,
            select: { id: true, pseudonymId: true, type: true, species: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
          },
          appointments: {
            take: 5,
            select: { id: true, slotStart: true, slotEnd: true, status: true },
            orderBy: { slotStart: 'desc' }
          }
        }
      });
      logger.debug("Fetched Clinic by ID successfully", { id, result, requestId, userId });
      return result as ClinicResponse;
    } catch (error) {
      logger.error("Error fetching Clinic by ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async getByTenantAndName(tenantId: string, name: string, requestId: string, userId: string): Promise<ClinicResponse | null> {
    try {
      const result = await prisma.clinic.findFirst({ 
        where: { 
          tenantId,
          name: { equals: name, mode: 'insensitive' }
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          }
        }
      });
      logger.debug("Fetched Clinic by tenant and name successfully", { tenantId, name, result, requestId, userId });
      return result as ClinicResponse;
    } catch (error) {
      logger.error("Error fetching Clinic by tenant and name:", { tenantId, name, error, requestId, userId });
      throw error;
    }
  },

  async update(id: string, data: ClinicUpdateInput, requestId: string, userId: string): Promise<ClinicResponse> {
    try {
      let addressId = data.addressId;
      
      // Create or update address if address object is provided
      if (data.address && !addressId) {
        // Get existing clinic to check if it has an address
        const existingClinic = await prisma.clinic.findUnique({ 
          where: { id },
          select: { addressId: true }
        });
        
        if (existingClinic?.addressId) {
          // Update existing address
          await prisma.address.update({
            where: { id: existingClinic.addressId },
            data: {
              ...data.address,
              updatedBy: userId
            }
          });
          addressId = existingClinic.addressId;
        } else {
          // Create new address
          addressId = await this.createAddress(data.address, requestId, userId);
        }
      }
      
      const { address, ...clinicData } = data;
      const result = await prisma.clinic.update({ 
        where: { id }, 
        data: {
          ...clinicData,
          ...(addressId && { addressId })
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true }
          },
          address: {
            select: { id: true, address: true, town: true, state: true, countryName: true }
          },
          doctors: {
            select: {
              id: true,
              roleInClinic: true,
              user: {
                select: { id: true, username: true, emailId: true }
              }
            }
          },
          settings: {
            select: { id: true, timezone: true, offlineAllowed: true, defaultLanguage: true }
          },
          _count: {
            select: { patients: true, appointments: true, visits: true }
          }
        }
      });
      logger.debug("Updated Clinic successfully", { id, data, result, requestId, userId });
      return result as ClinicResponse;
    } catch (error) {
      logger.error("Error updating Clinic with ID:", { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string): Promise<Clinic> {
    try {
      const result = await prisma.clinic.delete({ where: { id } });
      logger.debug("Deleted Clinic successfully", { id, result, requestId, userId });
      return result;
    } catch (error) {
      logger.error("Error deleting Clinic with ID:", { id, error, requestId, userId });
      throw error;
    }
  },
};