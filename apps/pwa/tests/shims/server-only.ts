// Test shim — `server-only` is a Next.js sentinel that throws if imported in a
// client bundle. In vitest (node) we replace it with this no-op so that
// modules importing "server-only" can be required from tests safely.
export {};
