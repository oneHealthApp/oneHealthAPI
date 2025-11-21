import { Prisma } from '@prisma/client';

/**
 * Data types used across Register module.
 */

export interface RegisterCreateInput {
  username: string;
  password: string;
  emailId?: string;
  mobileNumber?: string;
  countryDialCode?: string;
  fullName?: string;
  tenantId?: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  emailId?: string;
  mobileNumber?: string;
  fullName?: string;
  emailVerified: boolean;
  mobileValidationStatus: boolean;
  createdAt: Date;
}

export interface LoginRequest {
  identifier: string; // username, email, or mobile
  password: string;
}

export interface LogoutRequest {
  token?: string; // Optional: for token-based logout
  allDevices?: boolean; // Optional: logout from all devices
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    emailId?: string;
    fullName?: string;
    roles: any[];
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type UserWhereInput = Prisma.UserWhereInput;
export type UserOrderByInput = Prisma.UserOrderByWithRelationInput;