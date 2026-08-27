# Contributing to UONotes

Our goal is to keep the codebase clean, modular, and easy to iterate on. We prioritize separation of concerns and developer velocity to ensure we can build and scale the platform efficiently.

## Tech Stack
* **Framework:** Next.js 15 (App Router)
* **UI Library:** React
* **Styling:** Tailwind CSS (v3)

## Local Setup
1. Clone the repository.
2. Install dependencies:
   `npm install`
3. Start the development server:
   `npm run dev`

## Architecture & Folder Rules
Do not write monolithic page files. Follow this strict directory structure:

* `/app`: **Routing only.** Files like `page.tsx` should act as composition layers that import components, not giant blocks of UI code.
* `/components/ui`: **Reusable building blocks.** If a component is used on more than one page (e.g., `NoteCard`, `EventCard`), it belongs here.
* `/components/[feature]`: **Domain-specific UI.** Single-use components go into feature folders. For example, `/components/home/` holds sections that only exist on the homepage (e.g., `Hero.tsx`, `HowItWorks.tsx`).
* `/components/layout`: **Global Layouts.** Components that wrap the application (e.g., `Navbar.tsx`, `Footer.tsx`).
* `/components/icons/index.tsx`: **Centralized icons.** All raw SVGs must be exported from this single file as React components. Do not inline SVGs directly into page layouts.

## Styling Rules (Tailwind CSS)
We use Tailwind CSS to eliminate the overhead of managing separate CSS files and to enforce a consistent design system.

1. **Utility-First:** Use standard Tailwind utility classes directly in the `className` prop of your React components. Do not create `.module.css` files.
2. **Global Components:** If a UI element is highly repetitive (e.g., standard buttons like `.btn-primary` or standard layouts like `.section-wrapper`), it has been abstracted into `app/globals.css` under the `@layer components` directive. Use those classes to keep your JSX clean.
3. **Brand Colors:** Exact brand colors are mapped in `tailwind.config.ts`. Use the `brand-*` prefix (e.g., `text-brand-red`, `bg-brand-pink`, `border-brand-border-light`). 

## Development Workflow
1. Branch off `main` for your feature or fix (e.g., `feature/notes-page`, `fix/nav-alignment`, `design/hero-update`).
2. Keep Pull Requests focused. Do not mix deep architectural refactoring with new feature development in the same PR.
3. Open a Pull Request with a brief summary of what changed, why it changed, and what it looks like (if a UI change).

*Note: Backend integration is currently pending. Do not introduce global state management libraries or database clients until the backend architecture specification is finalized.*