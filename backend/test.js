const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');
    
    const residents = await prisma.users.findMany({
      where: {
        siteId: 1,
        account_status: 'ACTIVE',
        deleted_at: null
      },
      take: 2
    });
    
    console.log('Found residents:', residents.length);
    console.log(JSON.stringify(residents, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
