# ledgr

**Your daily spending companion. Built for freedom, not restriction.**

[ledgr.ink](https://ledgr.ink)

---

## What is ledgr?

A calendar-first financial planner that treats money as a fluid resource. Instead of rigid monthly budgets that punish you for one bad day, ledgr dynamically rebalances your spending across days.

**One sentence:** *Know exactly what you can spend today, every day.*

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini (future FastAPI backend)
- **Monorepo:** Turborepo with pnpm

---

## Project Structure

```
/ledgr
├── apps/
│   └── web/                 # Next.js frontend
├── packages/
│   ├── ui/                  # Shared React components
│   ├── database/            # Supabase types & schemas
│   ├── eslint-config/       # ESLint configs
│   └── typescript-config/   # TypeScript configs
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   ```
   Then fill in your Supabase credentials.

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm check-types` | Type check all packages |

---

## License

Private - All rights reserved.
