import { prisma } from "../common";
import { getModuleLogger } from "../utils";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const logger = getModuleLogger("auth-service");

/**
 * Enhanced Authentication Service
 * Handles multi-tenant authentication with automatic tenant/clinic context detection
 */

export interface LoginRequest {
  username: string;
  password: string;
  // Optional context - if not provided, will be determined from user's associations
  tenantId?: string;
  clinicId?: string;
}

export interface UserContext {
  userId: string;
  username: string;
  userType: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'CLINIC_USER' | 'REGULAR_USER';
  tenantId?: string;
  tenantName?: string;
  clinicIds: string[];
  clinics: Array<{
    id: string;
    name: string;
    clinicType: string;
    roleInClinic: string;
  }>;
  roles: string[];
  permissions: Array<{
    menuName: string;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }>;
}

export const AuthService = {
  /**
   * Enhanced login with automatic context detection
   */
  async login(loginData: LoginRequest): Promise<{ token: string; user: UserContext }> {
    try {
      // 1. Find user with all associations
      const user = await prisma.user.findUnique({
        where: { username: loginData.username },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true }
          },
          person: {
            select: { id: true, fullName: true, email: true, phone: true }
          },
          userRoles: {
            include: {
              role: {
                include: {
                  roleMenuAccess: {
                    include: {
                      menu: {
                        select: { menuName: true, path: true }
                      }
                    }
                  }
                }
              }
            }
          },
          clinics: {
            include: {
              clinic: {
                select: { id: true, name: true, clinicType: true, tenantId: true }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('Invalid username or password');
      }

      // 2. Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // 3. Check if user is locked
      if (user.isLocked) {
        throw new Error('Account is locked. Please contact administrator');
      }

      // 4. Determine user context and validate access
      const userContext = await this.determineUserContext(user, loginData);

      // 5. Generate JWT token
      const token = this.generateJWT(userContext);

      logger.info("User logged in successfully", { 
        userId: user.id, 
        username: user.username,
        userType: userContext.userType,
        tenantId: userContext.tenantId
      });

      return {
        token,
        user: userContext
      };

    } catch (error: any) {
      logger.error("Login failed", { error: error.message, username: loginData.username });
      throw error;
    }
  },

  /**
   * Determine user type and context based on associations
   */
  async determineUserContext(user: any, loginData: LoginRequest): Promise<UserContext> {
    // Extract permissions
    const permissions = user.userRoles.flatMap((ur: any) => 
      ur.role.roleMenuAccess.map((rma: any) => ({
        menuName: rma.menu.menuName,
        create: rma.create,
        read: rma.read,
        update: rma.update,
        delete: rma.delete
      }))
    );

    const roles = user.userRoles.map((ur: any) => ur.role.roleName);

    // 1. Super Admin: No tenant association + system roles
    if (!user.tenantId && roles.some((r: string) => r.includes('SUPER_ADMIN') || r.includes('SYSTEM'))) {
      return {
        userId: user.id,
        username: user.username,
        userType: 'SUPER_ADMIN',
        clinicIds: [],
        clinics: [],
        roles,
        permissions
      };
    }

    // 2. Tenant Admin: Has tenant but can access all clinics in tenant
    if (user.tenantId && roles.some((r: string) => r.includes('TENANT_ADMIN') || r.includes('ADMIN'))) {
      // Get all clinics in the tenant
      const tenantClinics = await prisma.clinic.findMany({
        where: { tenantId: user.tenantId },
        select: { id: true, name: true, clinicType: true }
      });

      return {
        userId: user.id,
        username: user.username,
        userType: 'TENANT_ADMIN',
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        clinicIds: tenantClinics.map((c: any) => c.id),
        clinics: tenantClinics.map((c: any) => ({
          id: c.id,
          name: c.name,
          clinicType: c.clinicType,
          roleInClinic: 'ADMIN'
        })),
        roles,
        permissions
      };
    }

    // 3. Clinic User: Specific clinic associations
    if (user.clinics.length > 0) {
      // Validate clinic access if clinicId provided in login
      if (loginData.clinicId) {
        const hasAccess = user.clinics.some((uc: any) => uc.clinic.id === loginData.clinicId);
        if (!hasAccess) {
          throw new Error('You do not have access to the specified clinic');
        }
      }

      // Validate tenant context if provided
      if (loginData.tenantId) {
        const hasAccess = user.clinics.some((uc: any) => uc.clinic.tenantId === loginData.tenantId);
        if (!hasAccess) {
          throw new Error('You do not have access to the specified tenant');
        }
      }

      const clinicsData = user.clinics.map((uc: any) => ({
        id: uc.clinic.id,
        name: uc.clinic.name,
        clinicType: uc.clinic.clinicType,
        roleInClinic: uc.roleInClinic
      }));

      return {
        userId: user.id,
        username: user.username,
        userType: 'CLINIC_USER',
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        clinicIds: user.clinics.map((uc: any) => uc.clinic.id),
        clinics: clinicsData,
        roles,
        permissions
      };
    }

    // 4. Regular User: Has tenant but no specific clinic associations
    if (user.tenantId) {
      return {
        userId: user.id,
        username: user.username,
        userType: 'REGULAR_USER',
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        clinicIds: [],
        clinics: [],
        roles,
        permissions
      };
    }

    throw new Error('User has insufficient permissions or invalid configuration');
  },

  /**
   * Generate JWT token with user context
   */
  generateJWT(userContext: UserContext): string {
    const payload = {
      userId: userContext.userId,
      username: userContext.username,
      userType: userContext.userType,
      tenantId: userContext.tenantId,
      clinicIds: userContext.clinicIds,
      roles: userContext.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
  },

  /**
   * Verify and decode JWT token
   */
  verifyJWT(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  /**
   * Get user context from token
   */
  async getUserContextFromToken(token: string): Promise<UserContext | null> {
    try {
      const decoded = this.verifyJWT(token);
      
      // Refresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          tenant: true,
          clinics: {
            include: {
              clinic: true
            }
          },
          userRoles: {
            include: {
              role: {
                include: {
                  roleMenuAccess: {
                    include: {
                      menu: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user || user.isLocked) {
        return null;
      }

      return await this.determineUserContext(user, {
        username: user.username,
        password: '' // Not needed for token validation
      });

    } catch (error: any) {
      logger.error("Error getting user context from token", { error: error.message });
      return null;
    }
  }
};