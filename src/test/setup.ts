/**
 * Vitest global setup — runs once before each test file.
 *
 * Registers @testing-library/jest-dom matchers (`.toBeInTheDocument`,
 * `.toHaveTextContent`, etc.) so the React component tests can assert
 * DOM without hand-rolling deep equality checks.
 *
 * Importing `@testing-library/jest-dom/vitest` is the canonical side-
 * effect entry that wires matchers into `expect`. Keeping it isolated
 * here means individual test files stay declarative.
 */
import '@testing-library/jest-dom/vitest'