# Le'Kiray ERP — Frontend

Next.js 14 App Router frontend for the Le'Kiray Contractor ERP system.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local

# Start development server
npm run dev
# Available at http://localhost:3000
```

## Environment Variables

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` to run without a backend (uses built-in mock data for every page).

## Key Routes

| Route | Page |
|-------|------|
| `/login` | Authentication |
| `/dashboard` | CEO Dashboard |
| `/dashboard/projects` | Projects list |
| `/dashboard/projects/[id]` | Project detail |
| `/dashboard/machinery` | Machinery fleet |
| `/dashboard/machinery/[id]` | Machine detail |
| `/dashboard/fuel` | Fuel management |
| `/dashboard/fuel/requests/[id]` | Fuel request detail |
| `/dashboard/inventory` | Inventory & materials |
| `/dashboard/inventory/items/[id]` | Item detail |
| `/dashboard/hr` | HR & attendance |
| `/dashboard/hr/employees/[id]` | Employee detail |
| `/dashboard/reports` | Daily site reports |
| `/dashboard/reports/[id]` | Report detail |
| `/dashboard/maintenance` | Maintenance records |
| `/dashboard/maintenance/[id]` | Maintenance detail |
| `/dashboard/finance` | Finance Lite dashboard |
| `/dashboard/finance/expenses` | Expenses directory |
| `/dashboard/finance/projects` | Project cost analysis |
| `/dashboard/finance/reports` | Finance charts |
| `/dashboard/finance/profitability` | Project profitability |
| `/dashboard/settings` | Company settings |

## Component Structure

```
src/
├── app/
│   ├── login/              # Auth page
│   └── dashboard/          # All module pages
│       ├── layout.tsx      # Dashboard shell with sidebar
│       ├── page.tsx        # CEO dashboard
│       ├── projects/
│       ├── machinery/
│       ├── fuel/
│       ├── inventory/
│       ├── hr/
│       ├── reports/
│       ├── maintenance/
│       ├── finance/
│       └── settings/
├── components/
│   ├── layout/
│   │   └── sidebar.tsx     # Navigation sidebar
│   ├── ui/                 # Shared UI components
│   │   ├── card.tsx
│   │   ├── loading-state.tsx
│   │   ├── empty-state.tsx
│   │   └── ...
│   ├── finance/            # Finance-specific badges
│   ├── maintenance/        # Maintenance-specific badges
│   └── ...
└── lib/
    └── utils.ts            # formatCurrency, formatDate, cn()
```

## Scripts

| Script | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| TypeScript check | `npx tsc --noEmit` |
| Lint | `npm run lint` |

## Mock Data Mode

All pages support `NEXT_PUBLIC_USE_MOCK_DATA=true`.  
When enabled, every page renders immediately with realistic demo data — no backend required.  
This is useful for:
- UI development without a running database
- Quick demos without full stack setup
- Frontend-only testing
