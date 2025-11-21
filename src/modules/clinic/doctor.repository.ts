import { prisma } from "../../common";
import { 
  DoctorCreateInput, 
  DoctorCreateResponse,
  DoctorDetails,
  UserCreateData,
  PersonCreateData,
  UserClinicCreateData
} from "./doctor.type";
import { getModuleLogger } from "../../utils";
import { hashPassword } from "../../utils/securityHelper";
import { Prisma, PersonType } from "@prisma/client";

const logger = getModuleLogger("doctor-repository");

/**
 * Repository layer for Doctor operations with database transactions.
 */
export const DoctorRepository = {
  /**
   * Create a doctor user with Person record in a single transaction
   */
  async createDoctor(
    data: DoctorCreateInput, 
    requestId: string, 
    createdBy: string
  ): Promise<DoctorCreateResponse> {
    try {
      logger.debug("Creating doctor with transaction", { data: { ...data, password: '***' }, requestId, createdBy });

      const result = await prisma.$transaction(async (tx) => {
        // 1. Check if username already exists
        const existingUser = await tx.user.findUnique({
          where: { username: data.username }
        });
        if (existingUser) {
          throw new Error('Username already exists');
        }

        // 2. Check if email already exists
        const existingEmail = await tx.user.findUnique({
          where: { emailId: data.email }
        });
        if (existingEmail) {
          throw new Error('Email already exists');
        }

        // 3. Check if phone already exists
        const existingPhone = await tx.user.findUnique({
          where: { mobileNumber: data.phone }
        });
        if (existingPhone) {
          throw new Error('Phone number already exists');
        }

        // 4. Verify clinic exists and belongs to tenant
        const clinic = await tx.clinic.findFirst({
          where: {
            id: data.clinicId,
            tenantId: data.tenantId,
            isActive: true
          }
        });
        if (!clinic) {
          throw new Error('Invalid clinic ID or clinic does not belong to the specified tenant');
        }

        // 5. Verify tenant exists
        const tenant = await tx.tenant.findFirst({
          where: {
            id: data.tenantId,
            isActive: true
          }
        });
        if (!tenant) {
          throw new Error('Invalid tenant ID');
        }

        // 6. Hash password
        const hashedPassword = await hashPassword(data.password);

        // 7. Create User record
        const userData: Omit<UserCreateData, 'createdBy' | 'updatedBy'> = {
          username: data.username,
          passwordHash: hashedPassword,
          emailId: data.email,
          mobileNumber: data.phone,
          tenantId: data.tenantId,
          emailVerified: false,
          emailValidationStatus: false,
          mobileValidationStatus: false,
          isLocked: false
        };

        const user = await tx.user.create({
          data: {
            ...userData,
            createdBy,
            updatedBy: createdBy
          }
        });

        // 8. Create Address record if address object is provided
        let addressId = data.addressId || null;
        if (data.address && !data.addressId) {
          const addressRecord = await tx.address.create({
            data: {
              address: data.address.address,
              townCode: data.address.townCode,
              town: data.address.town,
              pin: data.address.pin,
              subDistrictCode: data.address.subDistrictCode,
              subDistrict: data.address.subDistrict,
              districtCode: data.address.districtCode,
              district: data.address.district,
              stateCode: data.address.stateCode,
              state: data.address.state,
              countryId: data.address.countryId,
              countryName: data.address.countryName,
              geoLocation: data.address.geoLocation || null,
              createdBy,
              updatedBy: createdBy
            }
          });
          addressId = addressRecord.id;
        }

        // 9. Create Person record with DOCTOR role
        const fullName = [data.firstName, data.middleName, data.lastName]
          .filter(Boolean)
          .join(' ');

        const personMetadata = {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || null,
          externalId: data.externalId || null,
          signatureUrl: data.signatureUrl || null,
          profileImageUrl: data.profileImageUrl || null
        };

        const person = await tx.person.create({
          data: {
            tenantId: data.tenantId,
            type: 'DOCTOR' as PersonType,
            fullName,
            phone: data.phone,
            email: data.email,
            dateOfBirth: data.dateOfBirth || null,
            sex: data.sex,
            metadata: personMetadata,
            addressId: addressId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // 10. Link User to Person
        await tx.user.update({
          where: { id: user.id },
          data: { personId: person.id }
        });

        // 11. Create UserClinic association
        await tx.userClinic.create({
          data: {
            userId: user.id,
            clinicId: data.clinicId,
            roleInClinic: 'DOCTOR'
          }
        });

        logger.info("Doctor created successfully", { 
          userId: user.id, 
          personId: person.id, 
          requestId 
        });

        return {
          success: true,
          message: "Doctor created successfully",
          userId: user.id,
          personId: person.id
        };
      });

      return result;
    } catch (error) {
      logger.error("Error creating doctor", { error, requestId, createdBy });
      throw error;
    }
  },

  /**
   * Get doctor details by user ID
   */
  async getDoctorById(userId: string, requestId?: string): Promise<DoctorDetails | null> {
    try {
      logger.debug("Fetching doctor by ID", { userId, requestId });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          person: {
            include: {
              address: true
            }
          },
          clinics: {
            include: {
              clinic: true
            }
          }
        }
      });

      if (!user) return null;

      if (!user.person || user.person.type !== ('DOCTOR' as PersonType)) {
        throw new Error('User is not a doctor');
      }

      const result: DoctorDetails = {
        user: {
          id: user.id,
          username: user.username,
          emailId: user.emailId,
          mobileNumber: user.mobileNumber,
          emailVerified: user.emailVerified,
          mobileValidationStatus: user.mobileValidationStatus,
          isLocked: user.isLocked,
          profilePictureUrl: user.profilePictureUrl,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        person: {
          id: user.person.id,
          tenantId: user.person.tenantId,
          type: user.person.type,
          fullName: user.person.fullName,
          phone: user.person.phone,
          email: user.person.email,
          dateOfBirth: user.person.dateOfBirth,
          sex: user.person.sex,
          metadata: user.person.metadata,
          createdAt: user.person.createdAt,
          updatedAt: user.person.updatedAt,
          addressId: user.person.addressId,
          address: user.person.address ? {
            id: user.person.address.id,
            address: user.person.address.address,
            town: user.person.address.town,
            state: user.person.address.state,
            countryName: user.person.address.countryName,
            pin: user.person.address.pin
          } : null
        },
        clinic: user.clinics.length > 0 ? {
          id: user.clinics[0].clinic.id,
          name: user.clinics[0].clinic.name,
          clinicType: user.clinics[0].clinic.clinicType,
          isActive: user.clinics[0].clinic.isActive
        } : null
      };

      return result;
    } catch (error) {
      logger.error("Error fetching doctor", { error, userId, requestId });
      throw error;
    }
  },

  /**
   * Get doctors by clinic ID
   */
  async getDoctorsByClinic(
    clinicId: string, 
    tenantId?: string,
    requestId?: string
  ): Promise<DoctorDetails[]> {
    try {
      logger.debug("Fetching doctors by clinic", { clinicId, tenantId, requestId });

      const whereClause: any = {
        clinics: {
          some: {
            clinicId: clinicId,
            roleInClinic: 'DOCTOR'
          }
        },
        person: {
          type: 'DOCTOR'
        }
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        include: {
          person: {
            include: {
              address: true
            }
          },
          clinics: {
            where: { clinicId },
            include: {
              clinic: true
            }
          }
        }
      });

      return users.map(user => ({
        user: {
          id: user.id,
          username: user.username,
          emailId: user.emailId,
          mobileNumber: user.mobileNumber,
          emailVerified: user.emailVerified,
          mobileValidationStatus: user.mobileValidationStatus,
          isLocked: user.isLocked,
          profilePictureUrl: user.profilePictureUrl,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        person: {
          id: user.person!.id,
          tenantId: user.person!.tenantId,
          type: user.person!.type,
          fullName: user.person!.fullName,
          phone: user.person!.phone,
          email: user.person!.email,
          dateOfBirth: user.person!.dateOfBirth,
          sex: user.person!.sex,
          metadata: user.person!.metadata,
          createdAt: user.person!.createdAt,
          updatedAt: user.person!.updatedAt,
          addressId: user.person!.addressId,
          address: user.person!.address ? {
            id: user.person!.address.id,
            address: user.person!.address.address,
            town: user.person!.address.town,
            state: user.person!.address.state,
            countryName: user.person!.address.countryName,
            pin: user.person!.address.pin
          } : null
        },
        clinic: user.clinics.length > 0 ? {
          id: user.clinics[0].clinic.id,
          name: user.clinics[0].clinic.name,
          clinicType: user.clinics[0].clinic.clinicType,
          isActive: user.clinics[0].clinic.isActive
        } : null
      }));
    } catch (error) {
      logger.error("Error fetching doctors by clinic", { error, clinicId, tenantId, requestId });
      throw error;
    }
  }
};