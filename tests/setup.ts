if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must be set to run tests (point it at a Neon test branch)");
}

// Redirect the app's Prisma client at the dedicated test branch instead of
// the dev database. Must run before anything imports src/lib/prisma.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
