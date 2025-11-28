import { 
  DoctorCreateInput, 
  DoctorCreateResponse, 
  DoctorDetails,
  DoctorFilterOptions 
} from "./doctor.type";
import { DoctorRepository } from "./doctor.repository";
import { getModuleLogger } from "../../utils";

const logger = getModuleLogger("doctor-service");

/**
 * Business logic layer for Doctor operations.
 */
export const DoctorService = {
  /**
   * Create a new doctor with comprehensive validation
   */
  async createDoctor(
    data: DoctorCreateInput, 
    requestId: string, 
    userId: string
  ): Promise<DoctorCreateResponse> {
    try {
      logger.debug("Creating doctor", { 
        data: { ...data, password: '***' }, 
        requestId, 
        userId 
      });

      // Business logic validations
      if (!data.firstName || data.firstName.trim().length < 2) {
        throw new Error('First name must be at least 2 characters long');
      }

      if (!data.lastName || data.lastName.trim().length < 2) {
        throw new Error('Last name must be at least 2 characters long');
      }

      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email address is required');
      }

      if (!data.phone || data.phone.length < 10) {
        throw new Error('Valid phone number is required');
      }

      if (!data.username || data.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(data.password)) {
        throw new Error('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');
      }

      if (!data.clinicId) {
        throw new Error('Clinic ID is required');
      }

      if (!data.tenantId) {
        throw new Error('Tenant ID is required');
      }

      if (!['MALE', 'FEMALE', 'OTHER'].includes(data.sex)) {
        throw new Error('Sex must be MALE, FEMALE, or OTHER');
      }

      // Validate address requirements
      if (data.address && data.addressId) {
        throw new Error('Cannot provide both addressId and address object');
      }

      // Validate address object if provided
      if (data.address) {
        if (!data.address.address || data.address.address.trim().length === 0) {
          throw new Error('Address field is required in address object');
        }
        if (!data.address.pin || !/^[0-9]{6}$/.test(data.address.pin)) {
          throw new Error('Valid 6-digit pin code is required');
        }
        if (!data.address.town || !data.address.state || !data.address.countryName) {
          throw new Error('Town, state, and country name are required in address object');
        }
      }

      // Validate optional date of birth if provided
      if (data.dateOfBirth) {
        const dob = new Date(data.dateOfBirth);
        const today = new Date();
        if (dob > today) {
          throw new Error('Date of birth cannot be in the future');
        }
      }

      // Validate username format (alphanumeric only)
      if (!/^[a-zA-Z0-9]+$/.test(data.username)) {
        throw new Error('Username must contain only letters and numbers');
      }

      // Validate email format more strictly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      // Validate phone format
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(data.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Validate URLs if provided
      if (data.signatureUrl && !isValidUrl(data.signatureUrl)) {
        throw new Error('Invalid signature URL format');
      }

      if (data.profileImageUrl && !isValidUrl(data.profileImageUrl)) {
        throw new Error('Invalid profile image URL format');
      }

      return await DoctorRepository.createDoctor(data, requestId, userId);
    } catch (error) {
      logger.error("Error creating doctor", { error, requestId, userId });
      throw error;
    }
  },

  /**
   * Get doctor by ID with validation
   */
  async getDoctorById(
    doctorId: string, 
    requestId: string, 
    userId: string
  ): Promise<DoctorDetails | null> {
    try {
      logger.debug("Fetching doctor by ID", { doctorId, requestId, userId });

      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }

      return await DoctorRepository.getDoctorById(doctorId, requestId);
    } catch (error) {
      logger.error("Error fetching doctor by ID", { error, doctorId, requestId, userId });
      throw error;
    }
  },

  /**
   * Get doctors by clinic with filtering
   */
  async getDoctorsByClinic(
    clinicId: string,
    filters?: DoctorFilterOptions,
    requestId?: string, 
    userId?: string
  ): Promise<DoctorDetails[]> {
    try {
      logger.debug("Fetching doctors by clinic", { 
        clinicId, 
        filters, 
        requestId, 
        userId 
      });

      if (!clinicId) {
        throw new Error('Clinic ID is required');
      }

      const doctors = await DoctorRepository.getDoctorsByClinic(
        clinicId, 
        filters?.tenantId,
        requestId
      );

      // Apply filters
      let filteredDoctors = doctors;

      if (filters?.isActive !== undefined) {
        filteredDoctors = filteredDoctors.filter(doctor => 
          !doctor.user.isLocked === filters.isActive
        );
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doctor => 
          doctor.person.fullName?.toLowerCase().includes(searchTerm) ||
          doctor.person.email?.toLowerCase().includes(searchTerm) ||
          doctor.person.phone?.includes(searchTerm) ||
          doctor.user.username.toLowerCase().includes(searchTerm)
        );
      }

      return filteredDoctors;
    } catch (error) {
      logger.error("Error fetching doctors by clinic", { 
        error, 
        clinicId, 
        filters, 
        requestId, 
        userId 
      });
      throw error;
    }
  },

  /**
   * Get all doctors with tenant filtering
   */
  async getAllDoctors(
    tenantId?: string,
    filters?: DoctorFilterOptions,
    requestId?: string, 
    userId?: string
  ): Promise<DoctorDetails[]> {
    try {
      logger.debug("Fetching all doctors", { 
        tenantId, 
        filters, 
        requestId, 
        userId 
      });

      if (filters?.clinicId) {
        return await this.getDoctorsByClinic(
          filters.clinicId,
          { ...filters, tenantId },
          requestId,
          userId
        );
      }

      // For now, we'll return empty array if no clinic is specified
      // This could be extended to fetch all doctors across all clinics for a tenant
      logger.warn("Getting all doctors without clinic filter not yet implemented");
      return [];
    } catch (error) {
      logger.error("Error fetching all doctors", { 
        error, 
        tenantId, 
        filters, 
        requestId, 
        userId 
      });
      throw error;
    }
  }
};

/**
 * Helper function to validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}