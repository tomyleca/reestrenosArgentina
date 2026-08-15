import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60000,
    include: ["**/*.integration.test.ts"],
  },
  // Limitamos la concurrencia para no saturar recursos en tests de integración
  maxWorkers: 2,
});

