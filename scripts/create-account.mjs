// Admin utility: create or reset an account's password directly against the
// database, bypassing the public /register page. Useful for local setup or
// support. Usage: node scripts/create-account.mjs "Name" email@example.com password
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node scripts/create-account.mjs "Name" email@example.com password');
  process.exit(1);
}

const prisma = new PrismaClient();

const passwordHash = await bcrypt.hash(password, 10);

const account = await prisma.account.upsert({
  where: { email: email.toLowerCase() },
  update: { name, passwordHash },
  create: { name, email: email.toLowerCase(), passwordHash },
});

console.log(`Account ready: ${account.email} (${account.name})`);
await prisma.$disconnect();
