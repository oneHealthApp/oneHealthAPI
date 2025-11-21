import { prisma } from '../../common';
import { UserCreateInput } from './user.type';
import { getModuleLogger } from '../../utils';
import { User } from '@prisma/client';

const logger = getModuleLogger('user-repository');

export const UserRepository = {
  async findUserByIdentifier(identifier: string) {
    try {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier },
            { emailId: identifier },
            { mobileNumber: identifier },
          ],
        },
        include: {
          userRoles: {
            select: { roleId: true }, // Only get role IDs
          },
        },
      });
    } catch (error) {
      logger.error('Error finding user by identifier', { identifier, error });
      throw error;
    }
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });
  },

  async verifyEmailById(
    id: string,
    verifiedBy: string,
    expectedToken?: string,
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        emailValidationStatus: true,
        confirmationToken: null, // Clear the token after verification
        tokenGenerationTime: null,
        updatedBy: verifiedBy,
        updatedAt: new Date(),
      },
      include: { userRoles: true },
    });
  },

  async createUser(input: UserCreateInput) {
    try {
      return await prisma.user.create({
        data: input,
        include: {
          userRoles: true,
        },
      });
    } catch (error) {
      logger.error('Error creating user', {
        error,
        input: { ...input, passwordHash: '**REDACTED**' },
      });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.user.findMany();
      logger.debug('Fetched all menus successfully', {
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching all menus:', { error, requestId, userId });
      throw error;
    }
  },

  async blockUser(id: string, blockedBy: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        isLocked: true,
        lockedTillDate: new Date('9999-12-31'),
        updatedBy: blockedBy,
        updatedAt: new Date(),
      },
    });
  },

  async unblockUser(id: string, unblockedBy: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        isLocked: false,
        lockedTillDate: null,
        updatedBy: unblockedBy,
        updatedAt: new Date(),
      },
    });
  },

  async updateUserPassword(
    userId: string,
    hashedPassword: string,
    passwordExpiryDate?: Date,
    clearRecoveryToken: boolean = false,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordExpiryDate: passwordExpiryDate || undefined,
        ...(clearRecoveryToken && {
          passwordRecoveryToken: null,
          recoveryTokenTime: null,
        }),
        updatedAt: new Date(),
      },
    });
  },

  async verifyPhoneById(id: string, verifiedBy: string) {
    return prisma.user.update({
      where: { id },
      data: {
        mobileValidationStatus: true,
        updatedBy: verifiedBy,
        updatedAt: new Date(),
      },
      include: { userRoles: true },
    });
  },

  async updateVerificationToken(
    userId: string,
    emailToken: string | null,
    smsToken: string | null,
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        confirmationToken: emailToken,
        // Only update mobileValidationStatus if smsToken is not null and is a boolean string
        ...(smsToken !== null &&
          (smsToken === 'true' || smsToken === 'false') && {
            mobileValidationStatus: smsToken === 'true',
          }),
        tokenGenerationTime: new Date(),
        updatedAt: new Date(),
      },
    });
  },

  async findRoleById(roleId: string) {
    try {
      return await prisma.role.findUnique({
        where: { id: roleId },
        select: {
          id: true,
          roleName: true,
          priority: true,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('Error finding role by ID', { roleId, error });
      throw error;
    }
  },

  async findTenantById(tenantId: string) {
    try {
      return await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('Error finding tenant by ID', { tenantId, error });
      throw error;
    }
  },

  async findClinicById(clinicId: string) {
    try {
      return await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: {
          id: true,
          name: true,
          isActive: true,
          tenantId: true,
        },
      });
    } catch (error) {
      logger.error('Error finding clinic by ID', { clinicId, error });
      throw error;
    }
  },

  async createStaffWithTransaction(data: {
    userData: {
      username: string;
      passwordHash: string;
      emailId: string;
      mobileNumber: string;
      tenantId: string;
      emailValidationStatus: boolean;
      mobileValidationStatus: boolean;
      isLocked: boolean;
      multiSessionCount: number;
      createdBy: string;
      updatedBy: string;
    };
    personData: {
      tenantId: string;
      type: import('@prisma/client').PersonType;
      fullName: string;
      phone: string;
      email: string;
      sex: string | null;
    } | null;
    roleData: {
      roleId: string;
      priority: number;
      createdBy: string;
      updatedBy: string;
    };
    clinicData: {
      clinicId: string;
      roleInClinic: string;
    };
  }, requestId: string) {
    try {
      logger.debug('Starting staff creation transaction', { requestId });

      return await prisma.$transaction(async (tx) => {
        // 1. Create User
        const user = await tx.user.create({
          data: data.userData,
        });

        // 2. Create Person if staff role
        let person = null;
        if (data.personData) {
          person = await tx.person.create({
            data: data.personData,
          });

          // Link person to user
          await tx.user.update({
            where: { id: user.id },
            data: { personId: person.id },
          });
        }

        // 3. Create UserRole
        const userRole = await tx.userRole.create({
          data: {
            userId: user.id,
            ...data.roleData,
          },
        });

        // 4. Create UserClinic
        const userClinic = await tx.userClinic.create({
          data: {
            userId: user.id,
            ...data.clinicData,
          },
        });

        logger.debug('Staff creation transaction completed', {
          userId: user.id,
          personId: person?.id,
          requestId
        });

        return {
          user: {
            id: user.id,
            username: user.username,
            emailId: user.emailId,
            mobileNumber: user.mobileNumber,
            tenantId: user.tenantId,
            personId: user.personId,
            createdAt: user.createdAt,
          },
          person: person ? {
            id: person.id,
            tenantId: person.tenantId,
            type: person.type,
            fullName: person.fullName,
            phone: person.phone,
            email: person.email,
            sex: person.sex,
            createdAt: person.createdAt,
          } : undefined,
          userRole: {
            id: userRole.id,
            userId: userRole.userId,
            roleId: userRole.roleId,
            priority: userRole.priority,
          },
          userClinic: {
            id: userClinic.id,
            userId: userClinic.userId,
            clinicId: userClinic.clinicId,
            roleInClinic: userClinic.roleInClinic,
          },
        };
      });
    } catch (error) {
      logger.error('Error in staff creation transaction', { error, requestId });
      throw error;
    }
  },
};
