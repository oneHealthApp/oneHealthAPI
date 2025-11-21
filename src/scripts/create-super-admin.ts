import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin user...');

    // Check if super admin role exists
    const superAdminRole = await prisma.role.findFirst({
      where: { roleName: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found in database');
    }

    console.log('✅ Found SUPER_ADMIN role:', superAdminRole.id);

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingUser) {
      console.log('⚠️  User "admin" already exists. Checking role assignment...');
      
      // Check if user already has super admin role
      const existingRoleAssignment = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: existingUser.id,
            roleId: superAdminRole.id
          }
        }
      });

      if (existingRoleAssignment) {
        console.log('✅ User "admin" already has SUPER_ADMIN role');
        return existingUser;
      } else {
        // Assign super admin role to existing user
        await prisma.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: superAdminRole.id,
            priority: 1,
            createdBy: 'system',
            updatedBy: 'system'
          }
        });
        console.log('✅ SUPER_ADMIN role assigned to existing user "admin"');
        return existingUser;
      }
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('Admin@1234', 10);

    // Create super admin user
    const superAdminUser = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: passwordHash,
        emailId: 'admin@onehealth.com',
        emailVerified: true,
        emailValidationStatus: true,
        isLocked: false,
        multiSessionCount: 5,
        createdBy: 'system',
        updatedBy: 'system',
        // No tenantId for super admin (global access)
        tenantId: null
      }
    });

    console.log('✅ Super Admin user created:', superAdminUser.id);

    // Assign super admin role to user
    const roleAssignment = await prisma.userRole.create({
      data: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
        priority: 1,
        createdBy: 'system',
        updatedBy: 'system'
      }
    });

    console.log('✅ SUPER_ADMIN role assigned to user');

    console.log(`
🎉 Super Admin created successfully!

Login Details:
📧 Username: admin
🔑 Password: Admin@1234
🆔 User ID: ${superAdminUser.id}
🎭 Role ID: ${superAdminRole.id}

You can now login using these credentials.
    `);

    return superAdminUser;

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createSuperAdmin };