import { EnhancedAuthRepository } from './auth.repository.enhanced';
import { comparePassword } from '../../../utils/securityHelper';
import { getModuleLogger } from '../../../utils';

const logger = getModuleLogger('enhanced-auth-service');

// Mock token generation functions (you'll need to implement these)
function generateAccessToken(payload: any): string {
  // Implement JWT token generation here
  return 'mock-access-token';
}

function generateRefreshToken(payload: any): string {
  // Implement JWT refresh token generation here  
  return 'mock-refresh-token';
}

/**
 * Enhanced Auth Service with improved login response.
 */
export const EnhancedAuthService = {
  async login(
    identifier: string,
    password: string,
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ) {
    try {
      logger.debug('Attempting enhanced login', { identifier, requestId });

      const user = await EnhancedAuthRepository.findUserByIdentifier(identifier);
      if (!user) {
        logger.warn('User not found', { identifier, requestId });
        return { error: 'Invalid credentials', status: 401 };
      }

      if (user.isLocked) {
        logger.warn('User account is locked', { userId: user.id, requestId });
        return {
          error: 'Your account is inactive. Please contact support.',
          status: 403,
        };
      }

      // Check password
      if (!user.passwordHash) {
        logger.warn('User has no password set', { identifier, requestId });
        return { error: 'Invalid credentials', status: 401 };
      }

      const passwordMatch = await comparePassword(password, user.passwordHash);
      if (!passwordMatch) {
        logger.warn('Invalid password', { identifier, requestId });
        return { error: 'Invalid credentials', status: 401 };
      }

      return this._createUserSession(
        user,
        requestId,
        ipAddress,
        userAgent,
        deviceInfo,
      );
    } catch (error) {
      logger.error('Enhanced login error', { error, requestId });
      throw error;
    }
  },

  async _createUserSession(
    user: {
      id: string;
      username: string;
      emailId?: string | null;
      profilePictureUrl?: string | null;
      tenantId?: string | null;
      person?: {
        id: string;
        fullName?: string | null;
        phone?: string | null;
        email?: string | null;
      } | null;
      tenant?: {
        id: string;
        name: string;
        slug?: string | null;
      } | null;
      userRoles: Array<{
        role: {
          id: string;
          roleName: string;
          roleCategory?: string | null;
        };
      }>;
      clinics: Array<{
        clinic: {
          id: string;
          name: string;
          clinicType: string;
        };
      }>;
    },
    requestId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ) {
    // Extract role information
    const roles = user.userRoles.map((userRole) => ({
      roleId: userRole.role.id,
      roleName: userRole.role.roleName,
      roleCategory: userRole.role.roleCategory || null,
    }));

    // Extract role IDs for token payload
    const roleIds = user.userRoles.map((userRole) => userRole.role.id);
    
    // Extract clinic information
    const clinics = user.clinics.map((uc) => ({
      id: uc.clinic.id,
      name: uc.clinic.name,
      type: uc.clinic.clinicType,
    }));

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      roleIds,
    });
    
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
    });

    // Enhanced user response with additional information
    const userResponse = {
      id: user.id,
      username: user.username,
      userId: user.username, // For backward compatibility
      avatar: user.profilePictureUrl || '',
      userName: user.person?.fullName || user.username,
      email: user.person?.email || user.emailId || '',
      phone: user.person?.phone || '',
      authority: roles[0]?.roleCategory || '',
      
      // Enhanced role information
      roles: roles,
      
      // Primary role info (for backward compatibility)
      primaryRoleId: roles[0]?.roleId || null,
      primaryRoleName: roles[0]?.roleName || null,
      
      // Tenant information
      tenantId: user.tenantId || null,
      tenantName: user.tenant?.name || null,
      tenantSlug: user.tenant?.slug || null,
      
      // Clinic information
      clinicId: clinics[0]?.id || null,
      clinicName: clinics[0]?.name || null,
      clinicType: clinics[0]?.type || null,
      clinics: clinics,
      
      // Additional fields
      profilePictureUrl: user.profilePictureUrl,
    };

    logger.info('Enhanced user session created', {
      userId: user.id,
      roleCount: roles.length,
      clinicCount: clinics.length,
      hasTenant: !!user.tenantId,
      requestId,
    });

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  },
};