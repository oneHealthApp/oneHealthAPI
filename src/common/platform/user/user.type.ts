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

// error.types.ts
export interface ApiError {
  message: string;
  code: string;
  field?: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
    value?: any;
  }[];
}

export interface ConflictError extends ApiError {
  code: 'CONFLICT_ERROR';
  field: string;
  existingValue?: string;
}

export interface NotFoundError extends ApiError {
  code: 'NOT_FOUND_ERROR';
  resource: string;
  id?: string;
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_ERROR';
}

export interface AuthorizationError extends ApiError {
  code: 'AUTHORIZATION_ERROR';
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
