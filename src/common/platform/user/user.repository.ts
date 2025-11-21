import { prisma } from '../../../common';
import { UserCreateInput, UserUpdateInput } from './user.type';
import { getModuleLogger, PaginationInput } from '../../../utils';

const logger = getModuleLogger('user-repository');

/**
 * Repository layer for direct DB access (User entity).
 */
export const UserRepository = {
  async create(data: UserCreateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.user.create({ data });
      logger.debug('User created successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error creating User:', { error, requestId, userId });
      throw error;
    }
  },

  async register(data: UserCreateInput, requestId: string, userId: string) {
    try {
      const result = await prisma.user.create({ data });
      logger.debug('User registered successfully', {
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error registering User:', { error, requestId, userId });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      const result = await prisma.user.findMany();
      logger.debug('Fetched all users successfully', {
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching all users:', { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(
    pagination: PaginationInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({ skip, take: limit }),
        prisma.user.count(),
      ]);

      logger.debug('Fetched paginated users successfully', {
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
      logger.error('Error fetching paginated users:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.user.findUnique({ where: { id } });
      logger.debug('Fetched User by ID successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching User by ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  // user.repository.ts - Update the getFullById method to include all relevant data
  async getFullById(id: string) {
    try {
      const result = await prisma.user.findUnique({
        where: { id },
        include: {
          person: {
            include: {
              // Include all relevant person relations
              AddressProfile: {
                include: {
                  address: true,
                },
              },
              BankAccountProfile: {
                include: {
                  bankAccount: true,
                },
              },
              DisabilityProfile: true,
              PersonContactProfile: true,
              SkillsProfile: true,
              firstPersonRelations: {
                include: {
                  secondPerson: true,
                },
              },
              secondPersonRelations: {
                include: {
                  firstPerson: true,
                },
              },
              Family: true,
            },
          },
          UserRole: {
            include: {
              role: true,
            },
          },
          // Include any other relevant user relations
        },
      });

      logger.debug('Fetched full user by ID', { id, result });
      return result;
    } catch (error) {
      logger.error('Error fetching full user by ID:', { id, error });
      throw error;
    }
  },

  async update(
    id: string,
    data: UserUpdateInput,
    requestId: string,
    userId: string,
  ) {
    try {
      const result = await prisma.user.update({ where: { id }, data });
      logger.debug('Updated User successfully', {
        id,
        data,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error updating User with ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.user.update({
        where: { id },
        data: {
          isLocked: true,
          lockedTillDate: new Date(),
        },
      });
      logger.debug('Deleted User successfully', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error deleting User with ID:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async lockUser(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.user.update({
        where: { id: id },
        data: {
          isLocked: true,
          lockedTillDate: new Date(),
        },
      });
      logger.debug('Locked user account', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error locking user:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async unlockUser(id: string, requestId: string, userId: string) {
    try {
      const result = await prisma.user.update({
        where: { id: id },
        data: {
          isLocked: false,
          lockedTillDate: null,
        },
      });
      logger.debug('Unlocked user account', {
        id,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error unlocking user:', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async confirmEmail(token: string) {
    try {
      const result = await prisma.user.updateMany({
        where: { confirmationToken: token },
        data: { emailValidationStatus: true },
      });
      logger.debug('Email confirmed successfully', { token, result });
      return result;
    } catch (error) {
      logger.error('Error confirming email:', { token, error });
      throw error;
    }
  },

  async confirmMobile(identifier: string, otp: string) {
    try {
      const result = await prisma.user.update({
        where: { id: identifier },
        data: { mobileValidationStatus: true },
      });
      logger.debug('Mobile confirmed successfully', { identifier, result });
      return result;
    } catch (error) {
      logger.error('Error confirming mobile:', { identifier, error });
      throw error;
    }
  },

  async getProfile(userId: string) {
    try {
      const result = await prisma.user.findUnique({
        where: { id: userId },
        include: { person: true },
      });
      logger.debug('Fetched user profile successfully', { userId, result });
      return result;
    } catch (error) {
      logger.error('Error fetching user profile:', { userId, error });
      throw error;
    }
  },

  async attachRoles(userId: string, roleIds: string[], requestId: string) {
    try {
      const data = roleIds.map((roleId) => ({
        userId,
        roleId,
        priority: 1, // Set appropriate value or pass as parameter
        createdBy: userId, // Or pass the actual creator's ID
        updatedBy: userId, // Or pass the actual updater's ID
      }));
      const result = await prisma.userRole.createMany({
        data,
        skipDuplicates: true,
      });
      logger.debug('Roles attached successfully', {
        userId,
        roleIds,
        result,
        requestId,
      });
      return result;
    } catch (error) {
      logger.error('Error attaching roles:', {
        userId,
        roleIds,
        error,
        requestId,
      });
      throw error;
    }
  },

  async detachRoles(userId: string, roleIds: string[], requestId: string) {
    try {
      const result = await prisma.userRole.deleteMany({
        where: {
          userId,
          roleId: { in: roleIds },
        },
      });
      logger.debug('Roles detached successfully', {
        userId,
        roleIds,
        result,
        requestId,
      });
      return result;
    } catch (error) {
      logger.error('Error detaching roles:', {
        userId,
        roleIds,
        error,
        requestId,
      });
      throw error;
    }
  },

  async getUserRoles(userId: string) {
    try {
      const result = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      logger.debug('Fetched user roles', { userId, result });
      return result;
    } catch (error) {
      logger.error('Error fetching user roles:', { userId, error });
      throw error;
    }
  },

  async listFiltered(
    active: boolean | undefined,
    requestId: string,
    userId: string,
  ) {
    try {
      const filter = active === undefined ? {} : { isLocked: active };

      const result = await prisma.user.findMany({
        where: filter,
      });

      logger.debug('Fetched filtered users successfully', {
        active,
        result,
        requestId,
        userId,
      });

      return result;
    } catch (error) {
      logger.error('Error filtering users:', { error, requestId, userId });
      throw error;
    }
  },

  async getFullProfile(userId: string) {
    try {
      const result = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          person: {
            include: {
              AddressProfile: {
                include: {
                  address: true,
                },
              },
              BankAccountProfile: {
                include: {
                  bankAccount: true,
                },
              },
              DisabilityProfile: true,
              PersonContactProfile: true,
              SkillsProfile: true,
              firstPersonRelations: {
                include: {
                  secondPerson: true,
                },
              },
              secondPersonRelations: {
                include: {
                  firstPerson: true,
                },
              },
              Family: true,
            },
          },
          UserRole: {
            include: {
              role: true,
            },
          },
        },
      });

      logger.debug('Fetched full user profile', { userId, result });
      return result;
    } catch (error) {
      logger.error('Error fetching full user profile:', { userId, error });
      throw error;
    }
  },

  // user.repository.ts - Add this method
  async getUsersByRole(roleName: string, requestId: string, userId: string) {
    try {
      const result = await prisma.user.findMany({
        where: {
          UserRole: {
            some: {
              role: {
                roleName: roleName,
                isActive: true,
              },
            },
          },
        },
        include: {
          person: true,
          UserRole: {
            include: {
              role: true,
            },
          },
        },
      });

      logger.debug('Fetched users by role successfully', {
        roleName,
        result,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching users by role:', {
        roleName,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  // user.repository.ts - ADD THIS METHOD
  // user.repository.ts - Simplified getUsersByRoleId method
  async getUsersByRoleId(roleId: string, requestId: string, userId: string) {
    try {
      const result = await prisma.user.findMany({
        where: {
          UserRole: {
            some: {
              roleId: roleId,
              role: {
                isActive: true,
              },
            },
          },
        },
        include: {
          person: {
            // Only include basic person info, not all relations
            select: {
              id: true,
              salutation: true,
              nameInEnglish: true,
              nameInLocalLanguage: true,
              gender: true,
              dateOfBirth: true,
              email: true,
              mobile: true,
              // Exclude sensitive fields
            },
          },
          UserRole: {
            include: {
              role: true,
            },
          },
        },
      });

      logger.debug('Fetched users by role ID successfully', {
        roleId,
        resultCount: result.length,
        requestId,
        userId,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching users by role ID:', {
        roleId,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },
};
