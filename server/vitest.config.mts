import { defineConfig } from 'vitest/config';

// Test SELALU memakai database terpisah (ruangku_test), tidak menyentuh data dev.
export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? 'postgres://ruangku:ruangku_dev@localhost:5432/ruangku_test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-test-secret-123',
      CORS_ORIGIN: 'http://localhost:5173',
      // Foto unggahan test tidak mencampuri folder uploads pengembangan.
      UPLOAD_DIR: 'test-uploads',
      PUBLIC_URL: 'http://localhost:3000',
    },
    globalSetup: ['./test/global-setup.ts'],
    fileParallelism: false, // semua test berbagi satu database
    testTimeout: 20000,
  },
});
