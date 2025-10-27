import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('DIRECT_URL:', process.env.DIRECT_URL);
    
    // Test basic connection
    await prisma.$connect();
    console.log('✓ Database connected successfully!');
    
    // Try to query sites
    const sites = await prisma.site.findMany();
    console.log('✓ Sites found:', sites.length);
    
    if (sites.length > 0) {
      console.log('First site:', sites[0]);
    } else {
      console.log('⚠ No sites found in database');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
