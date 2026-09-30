# AGENTS.md — Project Rules & Structure for AI

This file defines the conventions, architecture, and design rules for the **fiqri.dev** portfolio site. AI agents must follow these rules precisely when reading, writing, or modifying any file in this project.

---

## Project Overview

**fiqri.dev** is the personal portfolio website of **Fiqri Syah Redha**, a Software Engineer. The site showcases his professional experience, projects, skills, education, and certifications.

The site is built as a static/hybrid site using [Astro](https://astro.build/) with [React](https://react.dev/) islands for interactive components. The visual identity follows a **Neo-Brutalism** design aesthetic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro v6 |
| UI Library | React v19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (Vite plugin) |
| Animation | Framer Motion v12 |
| Icons | Lucide React |
| Linter / Formatter | Biome v2 |
| Package Manager | Bun |
| Fonts | Space Grotesk, Inter, JetBrains Mono (via `@fontsource`) |

---

## Project Structure

```
src/
├── components/   # Reusable React (.tsx) UI primitives and interactive widgets
├── partials/     # Page sections — can be .astro or .tsx depending on interactivity
├── layouts/      # Astro layout wrappers (e.g., layout.astro)
├── data/         # Static typed data (portfolio-data.ts)
├── lib/          # Shared utility functions (utils.ts)
├── styles/       # Global CSS (global.css with @theme and Tailwind config)
└── pages/        # Astro page entry points
```

- **`src/components/`** — purely reusable, generic UI components. No business logic or data imports here.
- **`src/partials/`** — page-level sections that may consume data from `src/data/`. Use `.astro` for static content and `.tsx` for sections with complex interactivity or animations.
- **`src/data/portfolio-data.ts`** — single source of truth for all personal, experience, project, and skill data. All content changes happen here.
- **`src/lib/utils.ts`** — contains the `cn()` helper (clsx + tailwind-merge). Add other pure utility functions here.

---

## Design System — Neo-Brutalism

The site uses a **Neo-Brutalism** visual style. All components must adhere to these design tokens and patterns.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg-base` | `#faf9f6` | Page background, card backgrounds |
| `--color-primary` | `#ff90e8` | Primary CTA buttons, highlights |
| `--color-secondary` | `#ffc900` | Secondary buttons, focus outlines |
| `--color-accent` | `#23a094` | Accent elements, teal highlights |
| `--color-border-dark` | `#1e1e1e` | Borders, text color |

### Neo-Brutalism Rules

- **Borders**: Always `border-4 border-black` (or `border-2` on small/mobile variants). No `border-radius` — use `rounded-none` explicitly.
- **Box shadows**: Hard offset shadows with no blur. Use the custom shadow tokens:
  - `shadow-neo-sm` → `2px 2px 0px 0px rgba(30,30,30,1)`
  - `shadow-neo-base` → `4px 4px 0px 0px rgba(30,30,30,1)`
  - `shadow-neo-lg` → `8px 8px 0px 0px rgba(30,30,30,1)`
  - Or Tailwind arbitrary values: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- **Hover interactions**: Reduce shadow + translate the element to simulate a "press" effect.
  ```
  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
  active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
  ```
- **Focus**: Dashed yellow outline — `focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-secondary`.
- **Typography**:
  - Headings: `font-heading` (Space Grotesk), `font-bold`, fluid sizes via `text-fluid-h1/h2/h3`
  - Body: `font-body` (Inter)
  - Code/mono: `font-mono` (JetBrains Mono)
- **Background**: Dot-grid pattern defined globally on `body`. Do not override this.
- **Decorative elements**: Exposed HTML tag annotations (e.g., `<section class="hero">`) are intentional stylistic details in `.astro` section files.

---

## Code Conventions

### File Naming

All files must use **kebab-case**:

```
✅ hero-text-reveal.tsx
✅ portfolio-data.ts
✅ footer-cta.astro
❌ HeroTextReveal.tsx
❌ portfolioData.ts
```

### Exports

Always use **named exports**. Never use default exports for components or utilities.

```ts
// ✅ Correct
export const MyComponent = () => { ... };
export type MyProps = { ... };

// ❌ Wrong
export default function MyComponent() { ... }
```

Exception: Astro files (`.astro`) do not support named exports — the component itself is the default export as per the Astro framework.

### Functions & Components

Always use **arrow functions** for React components and utility functions.

```ts
// ✅ Correct
export const MyComponent = ({ title }: MyProps) => {
  return <div>{title}</div>;
};

// ❌ Wrong
export function MyComponent({ title }: MyProps) {
  return <div>{title}</div>;
}
```

For components that need a `ref`, use `forwardRef` with an arrow function and always set `.displayName`:

```ts
export const MyComponent = forwardRef<HTMLDivElement, MyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("...", className)} {...props} />
  ),
);
MyComponent.displayName = "MyComponent";
```

### TypeScript

- The project uses **strict TypeScript** (extends `astro/tsconfigs/strict`).
- Always type component props with a named `type` or `interface`. Prefer `type`.
- Use `import type` for type-only imports.
- Do not use `any`. Prefer `unknown` or proper generics.

```ts
// ✅ Correct
import { type ReactNode } from "react";

export type CardProps = {
  children: ReactNode;
  className?: string;
};
```

### Class Names

Always use the `cn()` helper from `src/lib/utils.ts` to merge class names. Never concatenate strings manually.

```ts
import { cn } from "../lib/utils";

className={cn("base-classes", conditionalClass && "extra", className)}
```

### Astro Islands

- Use `client:load` for components that need interactivity immediately on page load.
- Use `.astro` files for static, server-rendered sections whenever possible.
- Only reach for React (`.tsx`) when you need state, effects, animations, or event handling.

---

## Formatting & Linting (Biome)

The project uses **Biome** for linting and formatting. Configuration is in `biome.json`.

| Rule | Value |
|---|---|
| Indent | 2 spaces |
| Line width | 100 characters |
| Quotes | Double (`"`) |
| Semicolons | Always |
| Trailing commas | All |

Run checks with:

```bash
bun run lint      # Check for issues
bun run format    # Format files
bun run check     # Check + auto-fix
```

---

## Animation Guidelines

- Use **Framer Motion** for all React component animations.
- Keep animation durations short (100–300ms) for micro-interactions and spring-based for modal/dialog entrances.
- Use `AnimatePresence` for mount/unmount transitions.
- The site has a `raw-mode` body class that disables all animations and transitions — ensure no `animation` or `transition` CSS is set inline without a way to respect this mode.

---

## Data & Content

All site content lives in `src/data/portfolio-data.ts` as a single typed `portfolioData` export. Do not hardcode personal information (name, email, links) outside of this file.

The `terminalStack` export in the same file drives the draggable terminal widget in the hero section.

---

## Do's and Don'ts

**Do:**
- Follow neo-brutalism design tokens for every new UI element
- Use `cn()` for all className composition
- Use named arrow function exports for all React components
- Use kebab-case for all new filenames
- Add `.displayName` to all `forwardRef` components
- Keep components in `src/components/` generic and data-free
- Use `client:load` for interactive Astro islands

**Don't:**
- Use default exports for components or utilities
- Use `border-radius` values other than `rounded-none`
- Use soft/blurred box shadows — always use hard offset shadows
- Import portfolio data directly into `src/components/` files
- Use function declarations instead of arrow functions for components
- Skip TypeScript types on props
- Add comments or documentation unless explicitly requested
