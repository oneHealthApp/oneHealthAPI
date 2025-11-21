#!/usr/bin/env npx tsx

/**
 * Standalone Super Admin Creation Script
 * Usage: npm run create-super-admin
 */

import { createSuperAdmin } from '../src/scripts/create-super-admin';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('🚀 OneHealth API - Super Admin Creation');
  console.log('=====================================\n');

  try {
    console.log('Creating super admin user...');
    
    const superAdmin = await createSuperAdmin();
    
    console.log('✅ Super Admin created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Username: admin`);
    console.log(`   Password: Admin@1234`);
    console.log(`   Email: ${superAdmin.emailId}`);
    console.log(`   User ID: ${superAdmin.id}\n`);
    
    console.log('🔐 Authentication Endpoint:');
    console.log(`   POST /api/v1/auth/login`);
    console.log(`   Body: { "username": "admin", "password": "Admin@1234" }\n`);
    
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n💡 This usually means a user with this username already exists.');
      console.log('   Try logging in with: username="admin", password="Admin@1234"');
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});