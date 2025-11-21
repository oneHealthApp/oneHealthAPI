// mobile-settings.repository.ts

import { prisma } from '../../../common';
import { getModuleLogger } from '../../../utils';
import { getLogoUrl } from '../../shg/loan-policy/loan-policy.type';
import { MobileAppSettingsInput } from '../auth/auth.type';
import { v4 as uuidv4 } from 'uuid';

const logger = getModuleLogger('mobile-settings-repository');

export const MobileSettingsRepository = {
  async upsertMobileAppSettings(
    userId: string,
    settings: MobileAppSettingsInput,
  ) {
    try {
      // First, block all previous app instances for this user
      await prisma.mobile_App_Settings.updateMany({
        where: {
          userId: userId,
          isBlocked: false,
        },
        data: {
          isBlocked: true,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // Generate a new appInstanceId for this login
      const newAppInstanceId = uuidv4();

      // Create new mobile settings with the generated appInstanceId
      return await prisma.mobile_App_Settings.create({
        data: {
          userId: userId,
          appInstanceId: newAppInstanceId,
          appName: settings.appName,
          platform: settings.platform,
          fcmId: settings.fcmId,
          version: settings.version,
          isUpdateMandatory: true,
          deviceInfo: settings.deviceInfo,
          metaData: settings.metaData,
          isBlocked: false,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    } catch (error) {
      logger.error('Failed to upsert mobile app settings', {
        error,
        userId,
        appInstanceId: settings.appInstanceId,
      });
      throw new Error('Failed to update mobile app settings');
    }
  },

  async getMobileSettingsByAppInstance(appInstanceId: string) {
    try {
      return await prisma.mobile_App_Settings.findFirst({
        where: { appInstanceId },
        include: {
          user: {
            select: {
              id: true,
              userId: true,
              emailId: true,
              mobileNumber: true,
              isLocked: true,
              profilePictureUrl: true,
              person: {
                select: {
                  id: true,
                  nameInEnglish: true,
                  photoURL: true,
                  email: true,
                  mobile: true,
                  aadhaarMasked: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get mobile settings by app instance', {
        error,
        appInstanceId,
      });
      throw error;
    }
  },

  async getMobileSettingsByUserIdAndAppInstance(
    userId: string,
    appInstanceId: string,
  ) {
    try {
      return await prisma.mobile_App_Settings.findFirst({
        where: {
          userId,
          appInstanceId,
        },
        include: {
          user: {
            select: {
              id: true,
              emailId: true,
              mobileNumber: true,
              isLocked: true,
              profilePictureUrl: true,
              person: {
                select: {
                  id: true,
                  nameInEnglish: true,
                  aadhaarMasked: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error(
        'Failed to get mobile settings by user ID and app instance',
        {
          error,
          userId,
          appInstanceId,
        },
      );
      throw error;
    }
  },

  async getLatestMobileSettingsByUserId(userId: string) {
    try {
      return await prisma.mobile_App_Settings.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              emailId: true,
              mobileNumber: true,
              isLocked: true,
              profilePictureUrl: true,
              person: {
                select: {
                  id: true,
                  nameInEnglish: true,
                  aadhaarMasked: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get latest mobile settings by user ID', {
        error,
        userId,
      });
      throw error;
    }
  },

  async updateMobileAppSettings(
    appInstanceId: string,
    updates: Partial<{
      appName: string;
      platform: 'ANDROID' | 'IOS';
      fcmId: string;
      version: string;
      // Remove isUpdateMandatory from allowed updates
      deviceInfo: Record<string, any>;
      metaData: Record<string, any>;
      isBlocked: boolean;
    }>,
    updatedBy: string,
  ) {
    try {
      const settings = await prisma.mobile_App_Settings.findFirst({
        where: { appInstanceId },
      });

      if (!settings) {
        throw new Error('App instance not found');
      }

      return await prisma.mobile_App_Settings.update({
        where: { id: settings.id },
        data: {
          ...updates,
          updatedBy,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to update mobile app settings', {
        error,
        appInstanceId,
        updates,
      });
      throw error;
    }
  },
  async getUserOrganizations(userId: string) {
    try {
      // First get the user with personId
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          personId: true,
        },
      });

      if (!user || !user.personId) {
        return [];
      }

      // Then get the person's SHG memberships with organization details
      const memberships = await prisma.sHGMembership.findMany({
        where: {
          memberPersonId: user.personId,
          isActive: true,
        },
        include: {
          organization: {
            include: {
              address: true,
              OrgRegistration: {
                where: {
                  OR: [
                    { authority: 'Registrar of Societies' },
                    { authority: 'Election Commission' },
                    { regType: 'GST' },
                    { regType: 'PAN' },
                  ],
                },
                take: 5,
              },
            },
          },
        },
      });

      // Format the organization data
      return memberships.map((membership) => ({
        id: membership.organization.id,
        organizationName: membership.organization.organizationName,
        organizationCode: membership.organization.organizationCode,
        entityType: membership.organization.entityType,
        incorporationDate: membership.organization.incorporationDate,
        logo: getLogoUrl(membership.organization.documentList),
        address: membership.organization.address
          ? {
              address: membership.organization.address.address,
              town: membership.organization.address.town,
              district: membership.organization.address.district,
              state: membership.organization.address.state,
              pin: membership.organization.address.pin,
            }
          : null,
        membershipRole: membership.membershipRole,
        memberFromDate: membership.memberFromDate,
        memberValidTillDate: membership.memberValidTillDate,
      }));
    } catch (error) {
      logger.error('Failed to get user organizations', {
        error,
        userId,
      });
      throw error;
    }
  },

  async getMobileSettingsByUserId(userId: string) {
    try {
      return await prisma.mobile_App_Settings.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get mobile settings by user ID', {
        error,
        userId,
      });
      throw error;
    }
  },

  async getMobileSettingsByAppInstanceOnly(appInstanceId: string) {
    try {
      return await prisma.mobile_App_Settings.findFirst({
        where: { appInstanceId },
        include: {
          user: {
            select: {
              id: true,
              emailId: true,
              mobileNumber: true,
              isLocked: true,
              profilePictureUrl: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get mobile settings by app instance only', {
        error,
        appInstanceId,
      });
      throw error;
    }
  },
};
