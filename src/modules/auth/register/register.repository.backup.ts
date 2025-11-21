import { prisma } from "../../../common";
import {
  RegisterCreateInput,
  UserWhereInput,
  UserOrderByInput,
} from './register.type';
import { getModuleLogger } from "../../../utils";
import { User } from '@prisma/client';

const logger = getModuleLogger('register-repository');

export const RegisterRepository = {
  async createUser(data: RegisterCreateInput): Promise<User> {
    try {
      const userData: any = {
        username: data.username,
        passwordHash: data.password,
        emailId: data.emailId || null,
        mobileNumber: data.mobileNumber || null,
        countryDialCode: data.countryDialCode || null,
        createdBy: 'system',
        updatedBy: 'system'
      };
      
      const result = await (prisma.user.create as any)({
        data: userData,
        include: {
          person: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });
      logger.info('User created', { id: result.id, username: result.username });
      return result;
    } catch (error) {
      logger.error('Error creating user', { error });
      throw error;
    }
  },

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    try {
      const result = await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier },
            { emailId: identifier },
            { mobileNumber: identifier }
          ]
        },
        include: {
          person: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });
      return result;
    } catch (error) {
      logger.error('Error finding user by identifier', { error, identifier });
      throw error;
    }
  },

  async findUserById(id: string): Promise<User | null> {
    try {
      const result = await prisma.user.findUnique({
        where: { id },
        include: {
          person: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });
      return result;
    } catch (error) {
      logger.error('Error finding user by ID', { error, id });
      throw error;
    }
  },

  async checkUserExists(username: string, emailId?: string, mobileNumber?: string): Promise<boolean> {
    try {
      const whereConditions: any[] = [{ username }];
      if (emailId) whereConditions.push({ emailId });
      if (mobileNumber) whereConditions.push({ mobileNumber });

      const result = await prisma.user.findFirst({
        where: {
          OR: whereConditions
        }
      });
      return !!result;
    } catch (error) {
      logger.error('Error checking user existence', { error });
      throw error;
    }
  },

  async updateUserPassword(id: string, passwordHash: string): Promise<User> {
    try {
      const result = await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          passwordExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          updatedBy: 'system',
        }
      });
      logger.info('User password updated', { id });
      return result;
    } catch (error) {
      logger.error('Error updating user password', { error, id });
      throw error;
    }
  },

  async verifyEmail(id: string): Promise<User> {
    try {
      const result = await prisma.user.update({
        where: { id },
        data: {
          emailVerified: true,
          emailValidationStatus: true,
          updatedBy: 'system',
        }
      });
      logger.info('User email verified', { id });
      return result;
    } catch (error) {
      logger.error('Error verifying user email', { error, id });
      throw error;
    }
  },

  async verifyMobile(id: string): Promise<User> {
    try {
      const result = await prisma.user.update({
        where: { id },
        data: {
          mobileValidationStatus: true,
          updatedBy: 'system',
        }
      });
      logger.info('User mobile verified', { id });
      return result;
    } catch (error) {
      logger.error('Error verifying user mobile', { error, id });
      throw error;
    }
  }
};