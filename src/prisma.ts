import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './aws/getSecrets';

let prisma: PrismaClient;

export async function getPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    try {
      // 1. Get the dynamic DB URL from Secrets Manager
      const url = await getDatabaseUrl();
      if (!url) throw new Error('Database URL is empty');

      // 2. Initialize PrismaClient with dynamic datasource
      prisma = new PrismaClient({
        datasources: { db: { url } },
      });

      // 3. Test the connection
      await prisma.$connect();
      console.log('✅ Connected to AWS RDS PostgreSQL');
    } catch (err) {
      console.error('❌ Failed to connect to AWS RDS PostgreSQL:', err);
      throw err; // Stop app startup if DB connection fails
    }
  }

  return prisma;
}
