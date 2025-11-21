import { Prisma, Patient, PatientType, Species, PersonType } from '@prisma/client';

/**
 * Data types used across Patient module.
 */

/**
 * Input type for creating a Person (used within Patient creation).
 */
export interface PersonCreateInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date | string;
  sex?: string;
  gender?: string;
  tenantId?: string; // Will be added automatically
  type?: PersonType; // Will default to OTHER
}

/**
 * Input type for creating a new Patient.
 */
export interface PatientCreateInput {
  tenantId?: string; // Optional - can be derived from clinic
  clinicId: string; // Required
  pseudonymId?: string; // Optional - will be auto-generated if not provided
  type: PatientType;
  age?: number;
  sex?: string;
  species?: Species;
  breed?: string;
  hasIdentifyingInfo?: boolean;
  externalId?: string;
  ownerId?: string;
  addressId?: string;
  // Person fields - if provided, will create person automatically
  person?: Omit<PersonCreateInput, 'tenantId' | 'type'>;
  // Address fields - if provided, will create address automatically
  address?: {
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
  };
}

/**
 * Input type for updating an existing Patient.
 */
export interface PatientUpdateInput {
  tenantId?: string;
  clinicId?: string;
  pseudonymId?: string;
  type?: PatientType;
  age?: number;
  sex?: string;
  species?: Species;
  breed?: string;
  hasIdentifyingInfo?: boolean;
  externalId?: string;
  ownerId?: string;
  addressId?: string;
  // Person fields - if provided, will create/update person automatically
  person?: Omit<PersonCreateInput, 'tenantId' | 'type'>;
  // Address fields - if provided, will create/update address automatically
  address?: {
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
  };
}

/**
 * Patient response type with relations
 */
export interface PatientResponse extends Patient {
  clinic?: {
    id: string;
    name: string;
    clinicType: PatientType;
  };
  owner?: {
    id: string;
    person: {
      fullName: string | null;
      phone: string | null;
      email: string | null;
    };
  };
  address?: {
    id: string;
    address: string;
    town: string;
    state: string;
    countryName: string;
  };
  identities?: {
    id: string;
    nameCipher: string | null;
    phoneCipher: string | null;
    emailCipher: string | null;
    person?: {
      id: string;
      fullName: string | null;
      phone: string | null;
      email: string | null;
      dateOfBirth: Date | null;
      sex: string | null;
    };
  };
}

/**
 * Patient filter options
 */
export interface PatientFilterOptions {
  tenantId?: string;
  clinicId?: string;
  type?: PatientType;
  species?: Species;
  ownerId?: string;
  hasIdentifyingInfo?: boolean;
  search?: string; // For searching by external ID or pseudonym
}