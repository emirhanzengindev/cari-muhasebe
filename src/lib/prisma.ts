// Mock Prisma Client for Vercel deployment
export class PrismaClient {
  constructor() {
    console.log('Using mock PrismaClient for Vercel deployment');
  }

  // Mock methods that return empty/default values
  user = {
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  currentAccount = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  product = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  invoice = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  invoiceItem = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  category = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  warehouse = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  stockMovement = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  $connect = async () => {};
  $disconnect = async () => {};
}

export const prisma = new PrismaClient();

export default prisma;