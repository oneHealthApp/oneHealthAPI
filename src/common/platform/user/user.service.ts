import { UserCreateInput, UserUpdateInput } from './user.type';
import { UserRepository } from './user.repository';
import { getModuleLogger, hashPassword, PaginationInput } from '../../../utils';
import { prisma } from '../../../common';
import { RoleRepository } from '../role/role.repository';
import { generateEmailToken, maskAadhaar } from '../../../utils/securityHelper';
import { redisCacheHelper } from '../../../utils/redisCacheHelper';
import { Prisma, UserRole } from '@prisma/client';
import {
  PersonCreateInput,
  PersonUpdateInput,
} from '../../shg/person/person.type';
import { PersonRepository } from '../../shg/person/person.repository';
import dayjs from 'dayjs';
import { SmsService } from '../../../utils/smsService';

const logger = getModuleLogger('user-service');

export const UserService = {
  async create(data: UserCreateInput, requestId: string, userId: string) {
    try {
      logger.debug('Creating User', { data, requestId, userId });
      const createdUser = await UserRepository.create(data, requestId, userId);

      // Clear user caches related to lists
      await this.clearCache(createdUser.id);

      return createdUser;
    } catch (error) {
      logger.error('Error creating User', { error, requestId, userId });
      throw error;
    }
  },

  async register(data: UserCreateInput, requestId: string, userId: string) {
    try {
      logger.debug('Registering User', { data, requestId, userId });

      // Checks remain unchanged
      const existingUser = await prisma.user.findUnique({
        where: { userId: data.userId },
      });
      if (existingUser) {
        throw new Error('User already exists');
      }

      const existingUserByEmail = await prisma.user.findUnique({
        where: { emailId: String(data.emailId) },
      });
      if (existingUserByEmail) {
        throw new Error('Email ID already in use');
      }

      const existingUserByMobile = await prisma.user.findUnique({
        where: { mobileNumber: String(data.mobileNumber) },
      });
      if (existingUserByMobile) {
        throw new Error('Mobile number already in use');
      }

      const generatedConfirmationToken = generateEmailToken();
      const generatedTokenGenerationTime = new Date();
      const hashedPassword = data.password
        ? await hashPassword(data.password)
        : undefined;

      const createdUser = await UserRepository.register(
        {
          ...data,
          password: hashedPassword,
          confirmationToken: generatedConfirmationToken,
          tokenGenerationTime: generatedTokenGenerationTime,
          emailValidationStatus: false,
        },
        requestId,
        userId,
      );

      logger.debug('✅ User created successfully', { createdUser, requestId });

      // Clear user caches related to lists
      await this.clearCache(createdUser.id);

      // Sanitize user before returning
      const {
        password,
        passwordExpiryDate,
        passwordRecoveryToken,
        confirmationToken: token,
        tokenGenerationTime: tokenTime,
        ...safeUser
      } = createdUser;

      return safeUser;
    } catch (error) {
      logger.error('❌ Error registering user in service', {
        error,
        requestId,
      });
      throw error;
    }
  },

  async getAll(requestId: string, userId: string) {
    try {
      logger.debug('Fetching all users', { requestId, userId });

      const cacheKey = 'user:all';
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const users = await UserRepository.getAll(requestId, userId);

      if (!users || users.length === 0) {
        logger.debug('No users found', { requestId, userId });
        return []; // Return empty array if no users found
      }

      const sanitizedUsers = users.map((user) => {
        const {
          password,
          passwordExpiryDate,
          passwordRecoveryToken,
          confirmationToken,
          ...safeUser
        } = user;
        return safeUser;
      });

      await redisCacheHelper.set(cacheKey, sanitizedUsers, 300);
      return sanitizedUsers;
    } catch (error) {
      logger.error('Error fetching all users', { error, requestId, userId });
      throw error;
    }
  },

  async getPaginated(
    pagination: PaginationInput,
    requestId: string,
    userId: string,
  ) {
    try {
      logger.debug('Fetching paginated users', {
        pagination,
        requestId,
        userId,
      });

      const cacheKey = `user:paginated:${pagination.page}:${pagination.pageSize}:${JSON.stringify(pagination.filters || {})}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const result = await UserRepository.getPaginated(
        pagination,
        requestId,
        userId,
      );

      if (!result || !result.data || result.data.length === 0) {
        logger.warn('No users found for the given pagination parameters', {
          pagination,
          requestId,
          userId,
        });
        throw new Error('No users found');
      }

      const sanitizedData = result.data.map((user) => {
        const {
          password,
          passwordExpiryDate,
          passwordRecoveryToken,
          confirmationToken,
          ...safeUser
        } = user;
        return safeUser;
      });

      const paginatedResult = {
        ...result,
        data: sanitizedData,
      };

      await redisCacheHelper.set(cacheKey, paginatedResult, 300);
      return paginatedResult;
    } catch (error) {
      logger.error('Error fetching paginated users', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async get(id: string, requestId: string, userId: string) {
    try {
      const cacheKey = `user:${id}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const user = await UserRepository.get(id, requestId, userId);

      if (!user) {
        logger.warn('User not found', { id, requestId, userId });
        throw new Error('User not found');
      }

      if (user.isLocked) {
        logger.warn('Attempt to access locked user', { id, requestId, userId });
        throw new Error('User is locked');
      }

      // Sanitize user before returning
      const {
        password,
        passwordExpiryDate,
        passwordRecoveryToken,
        confirmationToken,
        ...safeUser
      } = user;

      await redisCacheHelper.set(cacheKey, safeUser, 600);
      return safeUser;
    } catch (error) {
      logger.error('Error fetching user by ID', {
        id,
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async getFullById(id: string) {
    try {
      // No caching here because full user may have sensitive info, leave as-is
      const user = await UserRepository.getFullById(id);

      if (!user) {
        logger.warn('User not found in getFullById', { id });
        throw new Error('User not found');
      }

      // if (user.isLocked) {
      //   logger.warn('Attempt to access locked user in getFullById', { id });
      //   throw new Error('User is locked');
      // }

      // Return the full user object with all relations
      return user;
    } catch (error) {
      logger.error('Error fetching full user by ID', { id, error });
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
      const user = await UserRepository.get(id, requestId, userId);
      if (!user) {
        logger.warn('User not found during update', { id, requestId, userId });
        return null;
      }

      if (user.isLocked) {
        logger.warn('Attempt to update a locked user', {
          id,
          requestId,
          userId,
        });
        throw new Error('User is locked and cannot be updated');
      }

      logger.debug('Updating User', { id, data, requestId, userId });

      // If password is present, hash it first
      let updateData = { ...data };

      // Handle password hashing
      if (typeof data.password === 'string') {
        updateData.password = await hashPassword(data.password);
      }

      const updatedUser = await UserRepository.update(
        id,
        updateData,
        requestId,
        userId,
      );

      await this.clearCache(id);

      // Sanitize user before returning
      const {
        password,
        passwordExpiryDate,
        passwordRecoveryToken,
        confirmationToken: token,
        tokenGenerationTime: tokenTime,
        ...safeUser
      } = updatedUser;

      return safeUser;
    } catch (error) {
      logger.error('Error updating user', { id, error, requestId, userId });
      throw error;
    }
  },

  async delete(id: string, requestId: string, userId: string) {
    try {
      const user = await UserRepository.get(id, requestId, userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isLocked) {
        throw new Error('Cannot delete a locked user');
      }

      const deletedUser = await UserRepository.delete(id, requestId, userId);

      // Clear caches related to this user
      await this.clearCache(id);

      // Sanitize before returning
      const {
        password,
        passwordExpiryDate,
        passwordRecoveryToken,
        confirmationToken,
        ...safeUser
      } = deletedUser;

      return safeUser;
    } catch (error) {
      logger.error('Error in delete', { id, error });
      throw error;
    }
  },

  async lockUser(id: string, requestId: string, userId: string) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          isLocked: true,
          lockedTillDate: true,
        },
      });
      logger.debug('Locking user', existingUser);
      if (!existingUser) {
        logger.warn('User not found for locking', { id, requestId, userId });
        throw new Error('User not found');
      }

      const now = new Date();
      if (
        existingUser.isLocked &&
        existingUser.lockedTillDate &&
        existingUser.lockedTillDate > now
      ) {
        logger.info('User is already locked', { id, requestId, userId });
        throw new Error('User is already locked');
      }

      if (existingUser.isLocked) {
        logger.info('User is already locked', { id, requestId, userId });
        throw new Error('User is already locked');
      }

      logger.debug('Locking user account', { id, requestId });
      const lockedUser = await UserRepository.lockUser(id, requestId, userId);

      // Clear cache for user after lock state change
      await this.clearCache(id);

      return lockedUser;
    } catch (error) {
      logger.error('Error locking user', { id, error });
      throw error;
    }
  },

  async unlockUser(id: string, requestId: string, userId: string) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { id } });

      if (!existingUser) {
        logger.warn('Attempted to unlock a non-existent user', {
          id,
          requestId,
          userId,
        });
        throw new Error('User not found');
      }

      if (!existingUser.isLocked) {
        logger.info('User is already unlocked', { id, requestId, userId });
        return existingUser;
      }

      logger.debug('Unlocking user account', { id, requestId });
      const unlockedUser = await UserRepository.unlockUser(
        id,
        requestId,
        userId,
      );

      // Clear cache for user after unlock
      await this.clearCache(id);

      return unlockedUser;
    } catch (error) {
      logger.error('Error unlocking user', { id, error });
      throw error;
    }
  },

  async getProfile(userId: string) {
    try {
      logger.debug('Fetching user profile', { userId });

      const cacheKey = `user:profile:${userId}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const user = await UserRepository.getProfile(userId);

      if (!user) {
        logger.warn('User not found while fetching profile', { userId });
        throw new Error('User not found');
      }

      const sanitizedUser = {
        id: user.id,
        userId: user.userId,
        emailId: user.emailId,
        mobileNumber: user.mobileNumber,
        emailValidationStatus: user.emailValidationStatus,
        mobileValidationStatus: user.mobileValidationStatus,
        profilePictureUrl: user.profilePictureUrl,
        isLocked: user.isLocked,
        person: user.person,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      await redisCacheHelper.set(cacheKey, sanitizedUser, 600);
      logger.debug('Fetched sanitized user profile successfully', { userId });
      return sanitizedUser;
    } catch (error) {
      logger.error('Error fetching user profile', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  async confirmEmail(token: string) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          confirmationToken: token,
        },
      });

      if (!user) {
        logger.warn('Invalid or expired confirmation token', { token });
        throw new Error('Invalid or expired confirmation token');
      }

      if (
        user.isLocked &&
        user.lockedTillDate &&
        user.lockedTillDate > new Date()
      ) {
        logger.warn('Cannot confirm email for locked user', {
          userId: user.id,
          lockedTillDate: user.lockedTillDate,
        });
        throw new Error('User account is currently locked');
      }

      logger.debug('Confirming email', { token });
      const confirmedUser = await UserRepository.confirmEmail(token);

      // Clear cache for user after email confirmation
      await this.clearCache(user.id);

      return confirmedUser;
    } catch (error) {
      logger.error('Error confirming email', { token, error });
      throw error;
    }
  },

  async confirmMobile(identifier: string, otp: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: identifier } });

      if (!user) {
        logger.warn('User not found', { identifier });
        throw new Error('User not found');
      }

      if (!user || user.mobileValidationStatus === true) {
        logger.warn('User not found or already mobile validated', {
          identifier,
        });
        return null;
      }

      if (
        user.isLocked &&
        user.lockedTillDate &&
        user.lockedTillDate > new Date()
      ) {
        logger.warn('Cannot confirm mobile for locked user', {
          userId: user.id,
          lockedTillDate: user.lockedTillDate,
        });
        throw new Error('User account is currently locked');
      }

      logger.debug('Confirming mobile', { identifier, otp });
      const confirmedUser = await UserRepository.confirmMobile(identifier, otp);

      // Clear cache for user after mobile confirmation
      await this.clearCache(identifier);

      return confirmedUser;
    } catch (error) {
      logger.error('Error confirming mobile', { identifier, error });
      throw error;
    }
  },

  async attachRoles(userId: string, roleIds: string[], requestId: string) {
    try {
      logger.debug('Attaching roles', { userId, roleIds, requestId });

      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid or missing userId');
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        throw new Error('At least one roleId must be provided');
      }

      for (const roleId of roleIds) {
        if (typeof roleId !== 'string' || roleId.trim() === '') {
          throw new Error(`Invalid roleId: ${roleId}`);
        }
      }

      const user = await UserRepository.get(userId, requestId, userId);
      if (!user) {
        throw new Error(`User with id ${userId} not found`);
      }
      if (user.isLocked) {
        throw new Error('Cannot attach roles to a locked user');
      }

      const existingRoles = await RoleRepository.findManyByIds(
        roleIds,
        requestId,
        userId,
      );
      if (existingRoles.length !== roleIds.length) {
        const existingRoleIds = existingRoles.map((r) => r.id);
        const missingRoleIds = roleIds.filter(
          (id) => !existingRoleIds.includes(id),
        );
        throw new Error(`Roles not found: ${missingRoleIds.join(', ')}`);
      }

      const inactiveRoles = existingRoles.filter((r) => !r.isActive);
      if (inactiveRoles.length > 0) {
        throw new Error(
          `Cannot attach inactive roles: ${inactiveRoles.map((r) => r.roleName || r.id).join(', ')}`,
        );
      }

      const userRoles = await UserRepository.getUserRoles(userId);
      const alreadyAssignedRoleIds = userRoles.map((ur) => ur.roleId);
      const duplicateRoles = roleIds.filter((id) =>
        alreadyAssignedRoleIds.includes(id),
      );
      if (duplicateRoles.length > 0) {
        throw new Error(
          `User already assigned these roles: ${duplicateRoles.join(', ')}`,
        );
      }

      const attachedRoles = await UserRepository.attachRoles(
        userId,
        roleIds,
        requestId,
      );

      // Clear user caches
      await this.clearCache(userId);

      return attachedRoles;
    } catch (error) {
      logger.error('Error attaching roles', { userId, error, requestId });
      throw error;
    }
  },

  async detachRoles(userId: string, roleIds: string[], requestId: string) {
    try {
      logger.debug('Detaching roles', { userId, roleIds, requestId });

      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid or missing userId');
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        logger.debug('No roles to detach', { userId, requestId });
        return { count: 0 };
      }

      const trimmedRoleIds = roleIds.map((id) => id.trim());
      if (trimmedRoleIds.some((id) => id === '')) {
        throw new Error('One or more roleIds are empty or invalid');
      }
      const uniqueRoleIds = new Set(trimmedRoleIds);
      if (uniqueRoleIds.size !== trimmedRoleIds.length) {
        throw new Error('Duplicate roleIds are not allowed');
      }

      const user = await UserRepository.get(userId, requestId, userId);
      if (!user) {
        throw new Error(`User with id ${userId} not found`);
      }
      if (user.isLocked) {
        throw new Error('Cannot detach roles from a locked user');
      }

      const userRoles = await UserRepository.getUserRoles(userId);
      const assignedRoleIds = userRoles.map((ur) => ur.roleId);
      const notAssignedRoleIds = trimmedRoleIds.filter(
        (id) => !assignedRoleIds.includes(id),
      );
      if (notAssignedRoleIds.length > 0) {
        throw new Error(
          `Cannot detach roles not assigned to user: ${notAssignedRoleIds.join(', ')}`,
        );
      }

      const detached = await UserRepository.detachRoles(
        userId,
        trimmedRoleIds,
        requestId,
      );

      // Clear caches
      await this.clearCache(userId);

      return detached;
    } catch (error) {
      logger.error('Error detaching roles', { userId, error, requestId });
      throw error;
    }
  },

  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid or missing userId');
      }

      const cacheKey = `user:roles:${userId}`;
      const cached = await redisCacheHelper.get<UserRole[]>(cacheKey);
      if (cached) return cached;

      logger.debug('Getting user roles', { userId });
      const roles: UserRole[] = await UserRepository.getUserRoles(userId);

      if (!roles || roles.length === 0) {
        logger.debug('No roles found for user', { userId });
        return [];
      }

      await redisCacheHelper.set(cacheKey, roles, 300);
      return roles;
    } catch (error) {
      logger.error('Error getting user roles', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  },

  async listFiltered(isLocked: boolean, requestId: string, userId: string) {
    try {
      logger.debug('Fetching filtered users', { isLocked, requestId, userId });

      const cacheKey = `user:filtered:${isLocked}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const filteredList = await UserRepository.listFiltered(
        isLocked,
        requestId,
        userId,
      );

      if (!filteredList || filteredList.length === 0) {
        const statusText = isLocked ? 'locked' : 'unlocked';
        throw new Error(`No ${statusText} user found`);
      }

      await redisCacheHelper.set(cacheKey, filteredList, 300);
      return filteredList;
    } catch (error) {
      logger.error('Error fetching filtered users', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  // user.service.ts - Update clearCache method
  async clearCache(userId: string) {
    try {
      logger.debug('Clearing user cache comprehensively', { userId });

      // Clear individual user caches
      await redisCacheHelper.delete(`user:${userId}`);
      await redisCacheHelper.delete(`user:profile:${userId}`);
      await redisCacheHelper.delete(`user:roles:${userId}`);
      await redisCacheHelper.delete(`user:full-profile:${userId}`);

      // Clear list caches with more specific patterns
      await redisCacheHelper.delete('user:all');
      await redisCacheHelper.deletePattern('user:paginated:*');
      await redisCacheHelper.deletePattern('user:filtered:*');
      await redisCacheHelper.deletePattern('user:by-role:*');
      await redisCacheHelper.deletePattern('user:by-role-id:*');

      // Add a small delay to ensure cache is cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      logger.debug('User cache cleared comprehensively', { userId });
      return true;
    } catch (error) {
      logger.error('Error clearing user cache', { userId, error });
      throw error;
    }
  },

  async createUserWithPersonAndRoles(
    personData: PersonCreateInput,
    userData: UserCreateInput,
    roleIds: string[],
    requestId: string,
    createdBy: string,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const prismaClient = tx || prisma;

    return await prisma.$transaction(async (tx) => {
      const client = tx;

      logger.debug('Starting createUserWithPersonAndRoles', {
        requestId,
        createdBy,
      });

      // VALIDATION: Check identifier uniqueness
      await this.checkIdentifierUniqueness(
        userData.emailId as string,
        userData.mobileNumber as string,
        userData.userId as string,
      );

      // VALIDATION: Check person identifier uniqueness
      await this.checkPersonIdentifierUniqueness(
        personData.email as string,
        personData.mobile as string,
      );

      // --- Rest of the existing code remains the same ---
      // Aadhaar: mask & hash
      if (personData.aadhaarHash) {
        const aadhaarValue = String(personData.aadhaarHash).trim();
        if (aadhaarValue) {
          personData.aadhaarMasked = maskAadhaar(aadhaarValue);
          personData.aadhaarHash = await hashPassword(aadhaarValue);
          logger.debug('Aadhaar processed', {
            aadhaarMasked: personData.aadhaarMasked,
            aadhaarHash: personData.aadhaarHash,
          });
        }
      }

      // --- PAN hash (optional)
      if (personData.panNumber) {
        personData.panNumber = await hashPassword(
          String(personData.panNumber).trim(),
        );
        logger.debug('PAN hashed', { panHash: personData.panNumber });
      }

      // Convert DOB to Date
      if (personData.dateOfBirth) {
        personData.dateOfBirth = dayjs(personData.dateOfBirth).toDate();
      }

      // --- Use personData.createdBy for auditing
      personData.createdBy = personData.createdBy;
      personData.updatedBy = personData.createdBy;
      personData.aadhaarVerifiedBy = personData.createdBy;

      // 1️⃣ Create Person
      const person = await client.person.create({ data: personData });
      logger.debug('Person created', { personId: person.id });

      // 2️⃣ Create Contact Profiles
      const contacts: any[] = [];
      if (person.mobile) {
        contacts.push({
          personId: person.id,
          contactType: 'mobile',
          contactAddress: person.mobile,
          countryDialCode: '+91',
          isPrimary: true,
          createdBy: personData.createdBy,
          updatedBy: personData.createdBy,
        });
      }
      if (person.email) {
        contacts.push({
          personId: person.id,
          contactType: 'email',
          contactAddress: person.email,
          isPrimary: false,
          createdBy: personData.createdBy,
          updatedBy: personData.createdBy,
        });
      }
      if (contacts.length) {
        await client.personContactProfile.createMany({
          data: contacts,
          skipDuplicates: true,
        });
        logger.debug('PersonContactProfiles created', { contacts });
      }

      // 3️⃣ Hash user password
      const hashedPassword = userData.password
        ? await hashPassword(userData.password)
        : undefined;

      logger.debug('User password hashed');

      // 4️⃣ Create or fetch User
      const userId = (userData.emailId || userData.mobileNumber)?.toString();
      if (!userId)
        throw new Error('Cannot create user: missing emailId and mobileNumber');

      let user = await client.user.findUnique({ where: { userId } });

      if (!user) {
        const userPayload: UserCreateInput = {
          ...userData,
          userId: userId!,
          password: hashedPassword,
          person: { connect: { id: person.id } },
          createdBy: personData.createdBy!,
          updatedBy: personData.createdBy!,
        };
        user = await client.user.create({ data: userPayload });
        logger.debug('User created', { userId: user.userId, id: user.id });
      } else {
        logger.debug('User already exists', {
          userId: user.userId,
          id: user.id,
        });
      }

      // 5️⃣ Validate roles
      const roleObjs = await client.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });
      if (roleObjs.length !== roleIds.length)
        throw new Error('One or more role IDs are invalid');
      logger.debug('Roles validated', { roleIds });

      // 6️⃣ Attach roles
      await client.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          priority: 1,
          createdBy: personData.createdBy,
          updatedBy: personData.createdBy,
        })),
        skipDuplicates: true,
      });
      logger.debug('Roles attached to user', { userId: user.id, roleIds });

      // 7️⃣ Return full user object
      const fullUser = await client.user.findUnique({
        where: { id: user.id },
        include: { person: true, UserRole: { include: { role: true } } },
      });

      logger.debug('Full user fetched', { userId: user.id });

      // 8️⃣ Send SMS with password (if mobile exists)
      if (personData.mobile && userData.password) {
        try {
          await SmsService.sendOtpSms(
            personData.mobile,
            userData.password as string,
            'user_creation',
          );
          logger.debug('Password SMS sent to user', {
            mobile: personData.mobile,
          });
        } catch (smsError) {
          logger.warn('Failed to send password SMS', {
            mobile: personData.mobile,
            error: smsError,
          });
          // Don't throw error - SMS failure shouldn't fail user creation
        }
      }
      await this.clearCache(userId);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return fullUser;
    });
  },

  async updateUserWithPersonAndRoles(
    userId: string,
    personData: Partial<PersonCreateInput>,
    userData: Partial<UserCreateInput>,
    roleIds: string[],
    requestId: string,
    updatedBy: string,
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // 1. First check if user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        include: { person: true },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (!existingUser.person) {
        throw new Error('Associated person not found');
      }

      // VALIDATION: Check identifier uniqueness (exclude current user)
      await this.checkIdentifierUniqueness(
        (userData.emailId as string) || (existingUser.emailId as string),
        (userData.mobileNumber as string) ||
          (existingUser.mobileNumber as string),
        (userData.userId as string) || existingUser.userId,
        userId, // exclude current user
      );

      // VALIDATION: Check person identifier uniqueness (exclude current person)
      await this.checkPersonIdentifierUniqueness(
        (personData.email as string) || (existingUser.person.email as string),
        (personData.mobile as string) || (existingUser.person.mobile as string),
        existingUser.person.id, // exclude current person
      );

      // VALIDATION: Check identifier uniqueness (exclude current user)
      if (userData.emailId || userData.mobileNumber || userData.userId) {
        await this.checkIdentifierUniqueness(
          (userData.emailId as string) || (existingUser.emailId as string),
          (userData.mobileNumber as string) ||
            (existingUser.mobileNumber as string),
          (userData.userId as string) || existingUser.userId,
          userId, // exclude current user
        );
      }

      // VALIDATION: Check person identifier uniqueness (exclude current person)
      if (personData.email || personData.mobile) {
        await this.checkPersonIdentifierUniqueness(
          (personData.email as string) || (existingUser.person.email as string),
          (personData.mobile as string) ||
            (existingUser.person.mobile as string),
          existingUser.person.id, // exclude current person
        );
      }

      // --- Rest of the existing code remains the same ---
      // Ensure dateOfBirth is a JS Date object before Prisma call
      const fixedPersonData: Partial<PersonCreateInput> = { ...personData };
      if (typeof fixedPersonData.dateOfBirth === 'string') {
        fixedPersonData.dateOfBirth = new Date(fixedPersonData.dateOfBirth);
      }
      // 2. Update Person
      const person = await tx.person.update({
        where: { id: existingUser.person.id },
        data: {
          ...fixedPersonData,
          updatedBy,
        },
        include: {
          AddressProfile: true,
          BankAccountProfile: true,
          DisabilityProfile: true,
        },
      });
      // 3. Prepare user update data
      const userUpdateData: Partial<UserCreateInput> = {
        ...userData,
        updatedBy,
      };
      // Only hash password if it's provided (for updates)
      if (userData.password) {
        userUpdateData.password = await hashPassword(userData.password);
      }
      // 4. Update User
      const user = await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
      // 5. Validate roles exist
      const roleObjs = await tx.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });
      if (roleObjs.length !== roleIds.length) {
        throw new Error('One or more role IDs are invalid');
      }
      // 6. Update roles - first remove existing, then add new ones
      await tx.userRole.deleteMany({
        where: { userId: user.id },
      });
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          priority: 1,
          createdBy: updatedBy, // Use updatedBy for createdBy in new roles
          updatedBy,
        })),
        skipDuplicates: true,
      });
      // 7. Return full updated user object
      const fullUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          person: true,
          UserRole: { include: { role: true } },
        },
      });

      // Clear cache after successful transaction
      await this.clearCache(userId);
      await new Promise((resolve) => setTimeout(resolve, 150));

      return fullUser;
    });
  },

  // Add this method to user.service.ts
  async getFullProfile(
    userId: string,
    requestId: string,
    requestingUserId: string,
  ) {
    try {
      logger.debug('Fetching full user profile', {
        userId,
        requestId,
        requestingUserId,
      });

      const cacheKey = `user:full-profile:${userId}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const user = await UserRepository.getFullProfile(userId);

      if (!user) {
        logger.warn('User not found for full profile', {
          userId,
          requestId,
          requestingUserId,
        });
        throw new Error('User not found');
      }

      if (user.isLocked) {
        logger.warn('Attempt to access full profile of locked user', {
          userId,
          requestId,
          requestingUserId,
        });
        throw new Error('User is locked and cannot access profile');
      }

      // Sanitize sensitive data
      const sanitizedProfile = this.sanitizeFullProfile(user);

      await redisCacheHelper.set(cacheKey, sanitizedProfile, 300); // Cache for 5 minutes
      return sanitizedProfile;
    } catch (error) {
      logger.error('Error fetching full user profile', {
        userId,
        error,
        requestId,
        requestingUserId,
      });
      throw error;
    }
  },

  sanitizeFullProfile(user: any) {
    const {
      password,
      passwordExpiryDate,
      passwordRecoveryToken,
      confirmationToken,
      tokenGenerationTime,
      recoveryTokenTime,
      ...sanitizedUser
    } = user;

    // Sanitize person data if exists
    if (sanitizedUser.person) {
      const { aadhaarHash, aadhaarMasked, panNumber, ...sanitizedPerson } =
        sanitizedUser.person;
      sanitizedUser.person = sanitizedPerson;
    }

    return sanitizedUser;
  },

  // user.service.ts - Add this method
  async getUsersByRole(roleName: string, requestId: string, userId: string) {
    try {
      logger.debug('Fetching users by role', { roleName, requestId, userId });

      const cacheKey = `user:by-role:${roleName}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const users = await UserRepository.getUsersByRole(
        roleName,
        requestId,
        userId,
      );

      if (!users || users.length === 0) {
        logger.debug('No users found with role', {
          roleName,
          requestId,
          userId,
        });
        return [];
      }

      const sanitizedUsers = users.map((user) => {
        const {
          password,
          passwordExpiryDate,
          passwordRecoveryToken,
          confirmationToken,
          ...safeUser
        } = user;
        return safeUser;
      });

      await redisCacheHelper.set(cacheKey, sanitizedUsers, 300);
      return sanitizedUsers;
    } catch (error) {
      logger.error('Error fetching users by role', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async updateProfile(
    userId: string,
    data: {
      person?: Partial<PersonUpdateInput>;
      profilePictureUrl?: string;
    },
    requestId: string,
    updatedBy: string,
  ) {
    try {
      logger.debug('Updating profile', { userId, data, requestId, updatedBy });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { person: true },
      });

      if (!user) {
        logger.warn('User not found for profile update', {
          userId,
          requestId,
          updatedBy,
        });
        throw new Error('User not found');
      }

      if (user.isLocked) {
        logger.warn('Attempt to update locked user profile', {
          userId,
          requestId,
          updatedBy,
        });
        throw new Error('User is locked and cannot update profile');
      }

      const updateUserData: UserUpdateInput = {
        updatedBy,
      };

      // Handle profile picture (allow empty string to clear it)
      if (data.profilePictureUrl !== undefined) {
        updateUserData.profilePictureUrl = data.profilePictureUrl || null;
      }

      // Handle person data
      if (data.person) {
        if (!user.person) {
          throw new Error('No associated person found for this user');
        }

        const personUpdate: PersonUpdateInput = {
          ...data.person,
          updatedBy,
        };

        // Convert empty strings to null
        Object.keys(personUpdate).forEach((key) => {
          if (personUpdate[key as keyof PersonUpdateInput] === '') {
            personUpdate[key as keyof PersonUpdateInput] = null as any;
          }
        });

        // Handle date conversion
        if (personUpdate.dateOfBirth) {
          if (typeof personUpdate.dateOfBirth === 'string') {
            // Handle empty date string
            if (personUpdate.dateOfBirth.trim() === '') {
              personUpdate.dateOfBirth = null;
            } else {
              personUpdate.dateOfBirth = new Date(personUpdate.dateOfBirth);
            }
          }
        }

        await PersonRepository.update(
          user.person.id,
          personUpdate,
          requestId,
          updatedBy,
        );
      }

      // Update user if there are changes beyond just updatedBy
      if (Object.keys(updateUserData).length > 1) {
        await UserRepository.update(
          userId,
          updateUserData,
          requestId,
          updatedBy,
        );
      }

      await this.clearCache(userId);
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Return updated profile
      const updatedProfile = await this.getFullProfile(
        userId,
        requestId,
        updatedBy,
      );

      return updatedProfile;
    } catch (error) {
      logger.error('Error updating profile', {
        userId,
        error,
        requestId,
        updatedBy,
      });
      throw error;
    }
  },

  // user.service.ts - ADD THIS METHOD
  // user.service.ts - FIXED getUsersByRoleId method
  async getUsersByRoleId(roleId: string, requestId: string, userId: string) {
    try {
      logger.debug('Fetching users by role ID', { roleId, requestId, userId });

      const cacheKey = `user:by-role-id:${roleId}`;
      const cached = await redisCacheHelper.get(cacheKey);
      if (cached) return cached;

      const users = await UserRepository.getUsersByRoleId(
        roleId,
        requestId,
        userId,
      );

      if (!users || users.length === 0) {
        logger.debug('No users found with role ID', {
          roleId,
          requestId,
          userId,
        });
        return [];
      }

      // Sanitize user data before returning
      const sanitizedUsers = users.map((user) => {
        const {
          password,
          passwordExpiryDate,
          passwordRecoveryToken,
          confirmationToken,
          tokenGenerationTime,
          recoveryTokenTime,
          ...safeUser
        } = user;

        // Since the repository only returns basic person info, no need to sanitize further
        // The person object already excludes sensitive fields
        return safeUser;
      });

      await redisCacheHelper.set(cacheKey, sanitizedUsers, 300);
      return sanitizedUsers;
    } catch (error) {
      logger.error('Error fetching users by role ID:', {
        error,
        requestId,
        userId,
      });
      throw error;
    }
  },

  async checkIdentifierUniqueness(
    emailId?: string,
    mobileNumber?: string,
    userId?: string,
    excludeUserId?: string,
  ): Promise<void> {
    const errors: string[] = [];

    // Check if userId exists
    if (userId) {
      const existingUserById = await prisma.user.findUnique({
        where: { userId },
        select: { id: true, userId: true },
      });

      if (
        existingUserById &&
        (!excludeUserId || existingUserById.id !== excludeUserId)
      ) {
        errors.push(`User ID '${userId}' is already in use`);
      }
    }

    // Check if email exists
    if (emailId) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { emailId },
        select: { id: true, emailId: true },
      });

      if (
        existingUserByEmail &&
        (!excludeUserId || existingUserByEmail.id !== excludeUserId)
      ) {
        errors.push(`Email '${emailId}' is already registered`);
      }
    }

    // Check if mobile exists
    if (mobileNumber) {
      const existingUserByMobile = await prisma.user.findUnique({
        where: { mobileNumber },
        select: { id: true, mobileNumber: true },
      });

      if (
        existingUserByMobile &&
        (!excludeUserId || existingUserByMobile.id !== excludeUserId)
      ) {
        errors.push(`Mobile number '${mobileNumber}' is already registered`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  },

  async checkPersonIdentifierUniqueness(
    email: string,
    mobile: string,
    excludePersonId?: string, // For updates, exclude current person
  ): Promise<void> {
    const errors: string[] = [];

    // Check if email exists in person
    if (email) {
      const existingPersonByEmail = await prisma.person.findFirst({
        where: { email },
        select: { id: true, email: true },
      });

      if (
        existingPersonByEmail &&
        (!excludePersonId || existingPersonByEmail.id !== excludePersonId)
      ) {
        errors.push(
          `Email '${email}' is already associated with another person`,
        );
      }
    }

    // Check if mobile exists in person
    if (mobile) {
      const existingPersonByMobile = await prisma.person.findFirst({
        where: { mobile },
        select: { id: true, mobile: true },
      });

      if (
        existingPersonByMobile &&
        (!excludePersonId || existingPersonByMobile.id !== excludePersonId)
      ) {
        errors.push(
          `Mobile number '${mobile}' is already associated with another person`,
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  },
};
