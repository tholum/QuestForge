import { beforeAll, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Use a separate test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

beforeAll(async () => {
  // Set up test database
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up database before each test
  const tablenames = await prisma.$queryRaw<
    Array<{ name: string }>
  >`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`;

  const tables = tablenames
    .map(({ name }) => name)
    .filter((name) => name !== '_prisma_migrations');

  try {
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }
  } catch (error) {
    console.log({ error });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma instance for tests
export { prisma };