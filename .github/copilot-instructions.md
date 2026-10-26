# Copilot PR review — Cranhua Frontend

When reviewing pull requests, check both code quality and architecture. Flag violations clearly; suggest concrete fixes.

## Code quality

- Correctness and edge cases; regressions relative to existing behavior
- Tests added or updated for new/changed behavior; `npm test` and `npm run build` should pass
- Security: no secrets, credentials, tokens, or API keys in the diff; avoid unsafe handling of user input (XSS, unsafe `innerHTML`, etc.)
- Style: ESLint + Prettier (2 spaces, single quotes, TypeScript strict); CI jobs `Lint` and `Format` must pass; keep changes consistent with surrounding code

## Architecture (Angular / TuaniStack)

- Organize by module/feature (lazy-loaded routes when appropriate); keep feature boundaries clear
- Prefer presentational (dumb) components for UI and container (smart) components for orchestration; put HTTP and shared state in services, not in templates or presentational components
- Avoid heavy business logic in templates; use pipes, methods, or services instead
- Routing: feature routes under clear path segments; guard auth and access at the route level when needed
- Identifiers and domain naming: Spanish where the project already uses Spanish (labels, i18n keys, domain terms)

Human approval (Calidad) remains required; Copilot comments assist review and do not replace it.
