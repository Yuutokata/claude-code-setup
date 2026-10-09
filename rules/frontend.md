---
paths:
  - "**/*.{ts,tsx,jsx}"
  - "**/tailwind.config.*"
  - "**/components.json"
---

# TypeScript, React, Tailwind, shadcn/ui

Detect the project's package manager from the lockfile (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`) and use that one.

## TypeScript

- `strict` mode; no `any` (use `unknown` and narrow); avoid non-null assertions and `as` casts, prefer type guards and `satisfies`.
- Model state with discriminated unions; derive types from schemas (`z.infer<typeof schema>`) so runtime validation and types cannot drift.
- Validate data from the network, forms and `localStorage` at the boundary (zod or valibot).
- Prefer immutable updates (spread, `map`/`filter`, `structuredClone`); never mutate props or state.
- Use named exports, small modules, and absolute imports via the configured alias.

## React

- Function components and hooks only. Keep components small; extract hooks (`useXyz`) for reusable logic.
- State: local first, lift only when needed; server state with TanStack Query (or the framework's data layer), not `useEffect` + `useState` fetching.
- `useEffect` is for synchronizing with external systems, not for derived data; compute derived values during render (`useMemo` only when measured). Always clean up subscriptions and timers; list dependencies honestly.
- Stable `key`s from data IDs, never array indexes for dynamic lists. Controlled inputs with `react-hook-form` plus zod resolver for forms.
- Handle loading, error and empty states for every async view. Use an error boundary around route-level UI.
- Accessibility: semantic elements, labels for inputs, keyboard operability, visible focus, sufficient contrast, `alt` text.

## Tailwind

- Utility classes in markup; extract repeated patterns into components, not `@apply` walls. Use design tokens (CSS variables / theme config) for colors, spacing and radii; avoid arbitrary values unless unavoidable.
- Mobile-first responsive prefixes (`sm:`, `md:`), `dark:` variants through the theme setup. Merge conditional classes with `cn()` (`clsx` + `tailwind-merge`).
- Follow the Tailwind version in the project (v3 `tailwind.config.js` vs v4 CSS-first `@theme`); do not mix their configuration styles.

## shadcn/ui

- Components are copied into the repo (`components/ui`); add them with the CLI (`npx shadcn@latest add <component>`), then edit them freely. Keep customizations in the copied files, not in wrappers that fight them.
- Respect `components.json` (aliases, style, base color, `cssVariables`). Compose from Radix-based primitives; keep `forwardRef`/`asChild` patterns intact.
- Reuse existing components before adding a new one; keep variants in `cva` definitions.

## Design quality (anti-slop)

- `impeccable` owns look and feel: layout, type, color, hierarchy, and the ban list (`craft-floor.md`). The brief and a project's `DESIGN.md` win over any skill. Run `npx impeccable detect <path>` on changed UI files before finishing; it is deterministic and catches AI tells (side-tab borders, gradient text, glow shadows, bounce easing, nested cards, Inter-by-default, low contrast).
- `apple-design` only for gesture-driven or physical motion (drawers, sheets, drag, springs, velocity handoff) and translucent chrome. It never overrides `impeccable`: use blur and glass only as a functional layer (sticky nav over scrolling content), not as decoration.
- `mobile-native` when the UI runs on phones or as a PWA (`dvh`/`svh`, tap highlight, input zoom, safe areas, hover gating). `pick-ui-library` (manual) before hand-rolling toasts, command menus, number animation or virtualization; check `package.json` first and keep libraries the project already uses.
- Use real hardware or a real browser screenshot for visual claims; never declare a design "polished" from code alone.

## Tooling and Tests

- Build with Vite when the project uses it; run `tsc --noEmit`, ESLint and the project's formatter (Prettier/Biome) before finishing.
- Unit and component tests with Vitest and Testing Library (query by role/label, test user-visible behavior); E2E with Playwright only for critical flows.
- No `console.log` in committed code; no secrets in client code. Everything shipped to the browser is public: only `VITE_`/`NEXT_PUBLIC_`-style variables are exposed, never put keys there.
