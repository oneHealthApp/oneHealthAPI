import { Prisma } from '@prisma/client';

/**
 * Data types used across User module.
 */

 /**
 * Input type for creating a new User.
 * Mirrors Prisma.UserCreateInput.
 */
export type UserCreateInput = Prisma.UserCreateInput;

/**
 * Input type for updating an existing User.
 * Mirrors Prisma.UserUpdateInput.
 */
export type UserUpdateInput = Prisma.UserUpdateInput;

/**
 * Input type for creating a staff user.
 */
export interface StaffCreateInput {
  tenantId: string;
  clinicId: string;
  name: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  roleId: string;
}

/**
 * Response type for staff creation.
 */
export interface StaffCreateResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      emailId: string | null;
      mobileNumber: string | null;
      tenantId: string | null;
      personId: string | null;
      createdAt: Date;
    };
    person?: {
      id: string;
      tenantId: string;
      type: string;
      fullName: string | null;
      phone: string | null;
      email: string | null;
      sex: string | null;
      createdAt: Date;
    };
    userRole: {
      id: string;
      userId: string;
      roleId: string;
      priority: number;
    };
    userClinic: {
      id: string;
      userId: string;
      clinicId: string;
      roleInClinic: string;
    };
  };
}