# Research OS

A research operating system built with Next.js, Neo4j, and AI capabilities.

## Structure

This monorepo contains:

- `apps/web` - Next.js 14 web application
- `packages/db` - Neo4j database utilities
- `packages/ai` - AI disambiguation utilities

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Neo4j database instance

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in the required values in `.env.local`

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm dev` - Start development server for web app
- `pnpm build` - Build all packages
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests with Vitest

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure the following environment variables:
   - NEO4J_URI
   - NEO4J_USERNAME
   - NEO4J_PASSWORD
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - OPENAI_API_KEY
   - FIRECRAWL_API_KEY
   - ASSEMBLYAI_API_KEY
4. Deploy
