# AIC26 Frontend

Single Page Application (SPA) for the AIC26 video search engine.

## Tech Stack
- **Framework:** Svelte 5 (no SvelteKit)
- **Styling:** Tailwind CSS
- **Components:** Bits UI, Phosphor Icons, Svelte Sonner (toast)
- **Build Tool:** Vite & TypeScript

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm / yarn

### Installation
```bash
npm install
```

### Development
Start the local development server:
```bash
npm run dev
```

### Build
Build for production:
```bash
npm run build
```

### Type Checking
Run Svelte and TypeScript checks:
```bash
npm run check
```

### For maintainer
3 main branches:
- `main`: master development
- `deploy`: online deploy, with both server are from external
- `deploy-offline` offline deploy, external backend & internal media server

`deploy` and `deploy-offline` should not be merge to `main`, For updating feature from `main` prefer rebase instead 