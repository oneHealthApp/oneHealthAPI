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