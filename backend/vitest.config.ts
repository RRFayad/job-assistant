import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./src/testing/test-env.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["src/testing/global-setup.ts"],
    setupFiles: ["src/testing/setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      FRONTEND_URL: "http://localhost:3000",
      BILLING_ENABLED: "false",
    },
    // A test turns billing on with vi.stubEnv; it's reset after each test.
    unstubEnvs: true,
    // The test files share one database, so they run one at a time.
    fileParallelism: false,
  },
});
