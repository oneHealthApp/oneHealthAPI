/**
 * TypeScript interfaces and types for Doctor operations.
 */
import { PersonType } from "@prisma/client";

export interface AddressCreateInput {
  address: string;
  townCode: string;
  town: string;
  pin: string;
  subDistrictCode: string;
  subDistrict: string;
  districtCode: string;
  district: string;
  stateCode: string;
  state: string;
  countryId: string;
  countryName: string;
  geoLocation?: any;
}

export interface DoctorCreateInput {
  // Required fields
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  clinicId: string;
  tenantId: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  
  // Optional fields
  middleName?: string;
  dateOfBirth?: Date;
  externalId?: string;
  signatureUrl?: string;
  profileImageUrl?: string;
  
  // Address fields - either provide addressId OR address object
  addressId?: string;
  address?: AddressCreateInput;
}

export interface DoctorUpdateInput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  externalId?: string;
  addressId?: string;
  address?: AddressCreateInput;
  signatureUrl?: string;
  profileImageUrl?: string;
  isActive?: boolean;
}

export interface DoctorFilterOptions {
  clinicId?: string;
  tenantId?: string;
  isActive?: boolean;
  search?: string;
}

export interface DoctorCreateResponse {
  success: boolean;
  message: string;
  userId: string;
  personId: string;
  roleId: string;
  roleName: string;
}

export interface DoctorDetails {
  user: {
    id: string;
    username: string;
    emailId: string | null;
    mobileNumber: string | null;
    emailVerified: boolean;
    mobileValidationStatus: boolean;
    isLocked: boolean;
    profilePictureUrl: string | null;
    tenantId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  person: {
    id: string;
    tenantId: string;
    type: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    dateOfBirth: Date | null;
    sex: string | null;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    addressId?: string | null;
    address?: {
      id: string;
      address: string;
      town: string;
      state: string;
      countryName: string;
      pin: string;
    } | null;
  };
  clinic?: {
    id: string;
    name: string;
    clinicType: string;
    isActive: boolean;
  } | null;
}

export interface UserCreateData {
  username: string;
  passwordHash: string;
  emailId: string;
  mobileNumber: string;
  tenantId: string;
  emailVerified: boolean;
  emailValidationStatus: boolean;
  mobileValidationStatus: boolean;
  isLocked: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface PersonCreateData {
  tenantId: string;
  type: PersonType;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth?: Date | null;
  sex: string;
  metadata?: any;
  createdBy: string;
  updatedBy: string;
  userId: string;
}

export interface UserClinicCreateData {
  userId: string;
  clinicId: string;
  roleInClinic: string;
}