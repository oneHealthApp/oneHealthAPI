import { Clinic, PatientType } from '@prisma/client';

/**
 * Data types used across Clinic module.
 */

/**
 * Input type for creating a new Clinic.
 */
export interface ClinicCreateInput {
  // Tenant info - if tenantId not provided, will create new tenant
  tenantId?: string;
  tenantName?: string; // Required if tenantId not provided
  tenantSlug?: string; // Optional, will be generated from tenantName if not provided
  
  name: string;
  clinicType: PatientType;
  isActive?: boolean;
  addressId?: string;
  phone?: string;
  email?: string;
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
 * Input type for updating an existing Clinic.
 */
export interface ClinicUpdateInput {
  tenantId?: string;
  name?: string;
  clinicType?: PatientType;
  isActive?: boolean;
  addressId?: string;
  phone?: string;
  email?: string;
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
 * Clinic response type with relations
 */
export interface ClinicResponse extends Clinic {
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  address?: {
    id: string;
    address: string;
    town: string;
    state: string;
    countryName: string;
  };
  doctors?: {
    id: string;
    roleInClinic: string;
    user: {
      id: string;
      username: string;
      emailId: string | null;
    };
  }[];
  settings?: {
    id: string;
    timezone: string | null;
    offlineAllowed: boolean;
    defaultLanguage: string | null;
  };
  _count?: {
    patients: number;
    appointments: number;
    visits: number;
  };
}

/**
 * Clinic filter options
 */
export interface ClinicFilterOptions {
  tenantId?: string;
  clinicType?: PatientType;
  isActive?: boolean;
  search?: string; // For searching by name, phone, email
}