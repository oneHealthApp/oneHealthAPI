import { prisma } from "../../../common";
import { RegisterCreateInput } from './register.type';
import { getModuleLogger } from "../../../utils";

const logger = getModuleLogger('register-repository');

export const RegisterRepository = {
  async createUser(data: RegisterCreateInput) {
    try {
      // Use $executeRaw for direct SQL to bypass Prisma type issues
      const result = await prisma.$executeRaw`
        INSERT INTO "User" (
          id, username, "passwordHash", "emailId", "mobileNumber", 
          "countryDialCode", "createdBy", "updatedBy", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${data.username},
          ${data.password},
          ${data.emailId || null},
          ${data.mobileNumber || null},
          ${data.countryDialCode || null},
          'system',
          'system',
          NOW(),
          NOW()
        )
      `;

      // Then fetch the created user
      const user = await prisma.user.findFirst({
        where: { username: data.username },
        include: {
          person: true,
          userRoles: {
            include: { role: true }
          }
        }
      });

      logger.info('User created', { username: data.username });
      return user;
    } catch (error) {
      logger.error('Error creating user', { error });
      throw error;
    }
  },

  async findUserByIdentifier(identifier: string) {
    try {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier },
            { emailId: identifier },
            { mobileNumber: identifier }
          ]
        },
        include: {
          person: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          clinics: {
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                  clinicType: true,
                  tenantId: true,
                },
              },
            },
          },
          userRoles: { 
            include: { 
              role: {
                select: {
                  id: true,
                  roleName: true,
                  roleCategory: true,
                },
              },
            },
          },
        }
      });
    } catch (error) {
      logger.error('Error finding user', { error });
      throw error;
    }
  },

  async findUserById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          person: true,
          userRoles: { include: { role: true } }
        }
      });
    } catch (error) {
      logger.error('Error finding user by ID', { error });
      throw error;
    }
  },

  async checkUserExists(username: string, emailId?: string, mobileNumber?: string) {
    try {
      const conditions: any[] = [{ username }];
      if (emailId) conditions.push({ emailId });
      if (mobileNumber) conditions.push({ mobileNumber });

      const result = await prisma.user.findFirst({
        where: { OR: conditions }
      });
      return !!result;
    } catch (error) {
      logger.error('Error checking user existence', { error });
      throw error;
    }
  },

  async updateUserPassword(id: string, passwordHash: string) {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          passwordExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          updatedBy: 'system',
        }
      });
    } catch (error) {
      logger.error('Error updating password', { error });
      throw error;
    }
  },

  async verifyEmail(id: string) {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          emailVerified: true,
          emailValidationStatus: true,
          updatedBy: 'system',
        }
      });
    } catch (error) {
      logger.error('Error verifying email', { error });
      throw error;
    }
  },

  async verifyMobile(id: string) {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          mobileValidationStatus: true,
          updatedBy: 'system',
        }
      });
    } catch (error) {
      logger.error('Error verifying mobile', { error });
      throw error;
    }
  }
};