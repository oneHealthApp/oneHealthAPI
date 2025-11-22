# Enhanced Login Response - OneHealth API

## Overview
This document outlines the changes needed to enhance the login response in the OneHealth API to include additional user information (role details, tenant ID, clinic ID) for the frontend.

## Current Issues Identified
1. **Schema Mismatch**: The existing auth service code uses field names that don't match the current Prisma schema
2. **Missing Tables**: References to `userSession`, `sHGMembership`, and `organization` tables that don't exist in the current schema
3. **Field Name Differences**: 
   - `user.password` vs `user.passwordHash`
   - `user.userId` vs `user.username`
   - `user.UserRole` vs `user.userRoles`

## Solution Provided

### 1. Enhanced Repository (`auth.repository.enhanced.ts`)
- **Compatible with current schema**: Uses correct field names from your Prisma schema
- **Includes necessary relations**: Fetches user with roles, tenant, and clinic data
- **Simplified approach**: Focuses on features supported by your current schema

### 2. Enhanced Service (`auth.service.enhanced.ts`)
- **Enhanced user response**: Includes all requested additional information
- **Backward compatibility**: Maintains existing response structure while adding new fields
- **Proper data extraction**: Maps schema data to the desired response format

### 3. Updated Types (`auth.type.ts`)
- **Enhanced LoginResponse**: Updated to include tenant and clinic information
- **Comprehensive user object**: Includes role details, tenant info, and clinic info

## Enhanced Login Response Structure

The enhanced login response now includes:

```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    // Basic user info
    id: string;
    username: string;
    userId: string; // For backward compatibility
    avatar: string;
    userName: string;
    email: string;
    phone: string;
    authority: string;
    
    // Enhanced role information
    roles: Array<{
      roleId: string;
      roleName: string;
      roleCategory: string;
    }>;
    
    // Primary role info (for backward compatibility)
    primaryRoleId: string | null;
    primaryRoleName: string | null;
    
    // Tenant information
    tenantId: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
    
    // Clinic information
    clinicId: string | null;
    clinicName: string | null;
    clinicType: string | null;
    clinics: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    
    // Additional fields
    profilePictureUrl: string | null;
  };
}
```

## Key Features

### ✅ Role Information
- **Multiple roles**: Full array of user roles with IDs, names, and categories
- **Primary role**: Backward-compatible primary role fields
- **Role-based authority**: Authority field based on primary role category

### ✅ Tenant Information
- **Tenant ID**: Direct tenant identifier
- **Tenant name**: Human-readable tenant name
- **Tenant slug**: URL-friendly tenant identifier

### ✅ Clinic Information
- **Primary clinic**: First clinic ID, name, and type for quick access
- **All clinics**: Complete array of user's clinics
- **Clinic type**: Includes patient type (HUMAN, PET, LIVESTOCK)

## Integration Steps

### 1. Immediate Solution (Minimal Changes)
To get the enhanced login response working with minimal disruption:

1. **Import the enhanced service**:
   ```typescript
   import { EnhancedAuthService } from './auth.service.enhanced';
   ```

2. **Use in login controller**:
   ```typescript
   const result = await EnhancedAuthService.login(identifier, password, requestId);
   ```

3. **Implement JWT helpers**: The enhanced service uses mock token functions that need to be replaced with your actual JWT implementation.

### 2. Full Integration (Recommended)
For a complete solution:

1. **Fix existing auth.service.ts**: Update field names to match your schema
2. **Update auth.repository.ts**: Use the corrected repository methods
3. **Remove unsupported features**: Comment out or remove code that references non-existent tables
4. **Add missing dependencies**: Implement JWT helpers and OTP helpers

## Missing Dependencies to Implement

1. **JWT Helpers** (`jwtHelper.ts`):
   ```typescript
   export function generateToken(payload: any, secret: string, options: any): string
   export function generateRefreshToken(payload: any): string
   export function verifyToken(token: string, secret: string): any
   ```

2. **OTP Helpers** (`otpHelper.ts`):
   ```typescript
   export const OtpHelper = {
     generateOtp: (identifier?: string) => Promise<string>
     storeOtp: (identifier: string, otp: string, purpose: string) => Promise<void>
     verifyOtp: (identifier: string, otp: string, purpose: string) => Promise<any>
   }
   ```

3. **Environment Variables**: Add missing env variables to your `.env` file:
   ```
   MULTI_LOGIN_SESSION_ALLOWED=false
   RECORD_USER_SESSION=false
   OTP_EXPIRY_SEC=300
   ```

## Benefits

1. **Enhanced Frontend Support**: Frontend now receives all necessary user context
2. **Role-based UI**: Frontend can render UI based on user roles
3. **Tenant Context**: Multi-tenant support with proper tenant identification
4. **Clinic Context**: Healthcare-specific clinic information for proper workflow
5. **Backward Compatibility**: Existing integrations continue to work
6. **Schema Compliance**: Compatible with your current Prisma schema

## Next Steps

1. **Test the enhanced repository**: Verify it works with your current schema
2. **Implement JWT helpers**: Add proper token generation and verification
3. **Update controllers**: Use the enhanced service in your auth controllers
4. **Test thoroughly**: Ensure all existing functionality still works
5. **Update frontend**: Leverage the new response data for enhanced UX

This solution provides a complete enhancement to your login response while maintaining compatibility with your existing schema and codebase structure.