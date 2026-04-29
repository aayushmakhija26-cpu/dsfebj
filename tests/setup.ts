import "@testing-library/jest-dom";
import { vi, beforeAll, afterAll } from "vitest";

// Set test encryption key
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = "test-encryption-key-for-unit-tests-32-chars-long";
}

// Mock next/navigation for unit tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next-intl for unit tests
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Suppress console.error for expected error boundary and async tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (
      msg.includes("ReactDOMTestUtils.act") ||
      msg.includes("not wrapped in act")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
