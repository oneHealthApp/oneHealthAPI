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
};
