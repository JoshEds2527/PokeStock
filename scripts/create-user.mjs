// Usage: node scripts/create-user.mjs "Name" email@example.com password
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node scripts/create-user.mjs "Name" email@example.com password');
  process.exit(1);
}

const prisma = new PrismaClient();

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  update: { name, passwordHash },
  create: { name, email: email.toLowerCase(), passwordHash },
});

console.log(`User ready: ${user.email} (${user.name})`);
await prisma.$disconnect();
