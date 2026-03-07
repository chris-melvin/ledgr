# ledgr

**Your daily spending companion. Built for freedom, not restriction.**

🌐 **Website:** [ledgr.app](https://ledgr.app)

---

## Vision

ledgr is a calendar-first financial planner that treats money as a fluid resource. Instead of rigid monthly budgets that punish you for one bad day, ledgr dynamically rebalances your spending across days—giving you clarity, flexibility, and peace of mind.

**One sentence:** *Know exactly what you can spend today, every day.*

---

## 1. Product Philosophy: "Freedom through Logic"

Most budgeting apps fail because they feel like punishment. ledgr is built on three pillars:

| Pillar | What It Means |
|--------|---------------|
| **Fresh Starts** | Every day is a new cell on the calendar. Overspending today doesn't "fail" the month—it simply rebalances tomorrow. No guilt, just math. |
| **The Marginalia Aesthetic** | Clean, neutral design with premium typography. The UI feels like a high-end paper planner, reducing the anxiety of looking at finances. |
| **Autonomous Buckets** | The "Flex Bucket" allows guilt-free spending on big-ticket items without breaking your daily rhythm. |

---

## 2. Who Is ledgr For?

ledgr is designed to serve **anyone who wants a simpler, less stressful relationship with money**—from first-time budgeters to seasoned financial planners.

### Target Segments

| Segment | Pain Point | How ledgr Helps |
|---------|------------|---------------------|
| **Paycheck-to-Paycheck Earners** *(Initial GTM Focus)* | Monthly budgets fail them; they need daily clarity | Daily allowance + auto-rebalancing removes the mental math |
| **Freelancers & Gig Workers** | Irregular income makes traditional budgets impossible | Flexible income tracking + dynamic daily limits adapt to cash flow |
| **Young Professionals** | Want to save but hate spreadsheets | Beautiful UI + 3-second logging makes it feel effortless |
| **Couples & Families** | Need shared visibility without conflict | Shared calendars + individual flex buckets maintain autonomy |
| **Debt Reducers** | Overwhelmed by multiple payments | Debt pips + snowball visualization keep them motivated |
| **Savers & Investors** | Want to optimize surplus allocation | Strategy Coach identifies "low-spend" days for auto-investing |

### Initial Go-To-Market Strategy

**Primary Target:** Young urban professionals (25-35) living paycheck-to-paycheck or week-to-week, who find monthly spreadsheets overwhelming.

**Why start here:**
- Highest pain intensity (daily financial anxiety)
- Underserved by existing apps (Mint, YNAB focus on monthly)
- Strong word-of-mouth potential (shared struggle)
- Lower CAC via social/community channels

**Expansion path:** Once product-market fit is proven, expand horizontally to adjacent segments.

---

## 3. Technical Architecture

### Current Stack (Frontend)

| Component | Technology |
|-----------|------------|
| Framework | React 18+ |
| Styling | Tailwind CSS (Stone/Amber palette) |
| Icons | Lucide React |
| AI Integration | Google Gemini 2.5 Flash |

### Recommended Monorepo Structure

```
/ledgr
├── /apps
│   ├── /web              # React Frontend (Next.js)
│   ├── /mobile           # React Native (future)
│   └── /api              # Python (FastAPI) Backend
├── /packages
│   ├── /database         # Prisma or SQLAlchemy schemas
│   ├── /ai-logic         # Shared prompt templates
│   └── /shared-types     # TypeScript types
└── /infra                # Terraform/Pulumi configs
```

### The Python AI Backend

The backend handles:

- **NLP Processing:** Parsing complex strings like "Spent 500 on dinner and 200 on drinks" using Gemini.
- **Forecasting:** Using pandas to calculate "Burn Rate" and predicting when the Flex Bucket will run dry.
- **Strategic Rebalancing:** Moving beyond simple division to suggest rebalancing based on historical "low-spend" days.

---

## 4. Core Logic Engines

### A. The Daily Allowance Calculation

The "Safe-to-Spend" number for any given day ($D_{rem}$) is calculated as:

$$D_{rem} = (D_{base} + F_{inj}) - E_{day} - D_{day}$$

Where:
- **$D_{base}$**: Default daily limit (e.g., ₱300 / $20)
- **$F_{inj}$**: Injections from the Flex Bucket
- **$E_{day}$**: Total expenses logged for that day
- **$D_{day}$**: Mandatory debt payments due on that day

### B. Waterflow Rebalancing

When $E_{day} > (D_{base} + F_{inj})$, the system triggers a rebalance:

- **UI Action:** The day turns Rose (Red)
- **Logical Action:** The deficit is subtracted from the "Weekly Total," effectively lowering $D_{base}$ for subsequent days until reconciled

---

## 5. Key Feature Set

| Feature | Description |
|---------|-------------|
| **Flex Bucket** | A reserve pool that sits outside daily limits. Users "inject" funds into specific days for luxuries or emergencies. |
| **Income Pips** | Visual indicators on the calendar showing when income arrives—"Financial High Tide" visualization. |
| **Smart Entry** | Natural language input powered by Gemini. Say "coffee 150 and grab 80" and it logs both instantly. |
| **Strategy Coach** | Weekly AI analysis that reads calendar data to suggest when to be frugal and when to indulge. |
| **Quick Templates** | One-tap buttons for repetitive daily costs (Coffee, Commute, Lunch). |
| **Multi-Currency** | Support for multiple currencies with real-time conversion (critical for international expansion). |
| **Shared Calendars** | Couples/families can share a calendar while maintaining individual flex buckets. |

---

## 6. Development Roadmap

### Phase 1: MVP & Validation *(Current)*
- [ ] Implement Supabase for persistence (expenses, flexBucket, dailyOverrides)
- [ ] Authentication via Google/Email
- [ ] Core calendar UI with daily allowance display
- [ ] Basic Smart Entry (Gemini integration)

### Phase 2: Core Experience Polish
- [ ] Move Gemini logic to Python FastAPI endpoint
- [ ] Structured JSON responses for transaction parsing
- [ ] Quick Templates system
- [ ] PWA support for mobile-like experience

### Phase 3: Visualizations & Insights
- [ ] Spending Heatmap (color-coded calendar)
- [ ] Debt Snowball Progress visualization
- [ ] Weekly Strategy Coach reports
- [ ] Export to CSV/PDF

### Phase 4: Expansion Features
- [ ] React Native mobile apps (iOS/Android)
- [ ] Shared calendars for couples/families
- [ ] Bank sync integrations (Plaid, regional providers)
- [ ] Multi-currency support

---

## 7. Scaling Strategy

### 7.1 User Growth Scaling

| Stage | Users | Focus | Key Actions |
|-------|-------|-------|-------------|
| **Seed** | 0 - 1K | Product-Market Fit | Manual onboarding, high-touch feedback loops, iterate daily |
| **Early** | 1K - 10K | Retention & Referrals | Implement referral program, optimize onboarding funnel |
| **Growth** | 10K - 100K | Acquisition Channels | Content marketing, influencer partnerships, SEO |
| **Scale** | 100K - 1M | Efficiency & Monetization | Paid acquisition, premium tiers, B2B partnerships |
| **Mature** | 1M+ | Platform & Ecosystem | API for third-party integrations, white-label offerings |

### 7.2 Geographic Expansion

**Phase 1: Philippines (Home Market)**
- Deep localization (₱, local banks, GCash/Maya integration)
- Tagalog language support
- Local influencer partnerships

**Phase 2: Southeast Asia**
- Indonesia, Vietnam, Thailand, Malaysia
- Regional payment integrations
- Localized AI prompts for each language

**Phase 3: Global Markets**
- English-speaking markets (US, UK, Australia)
- Europe (EU compliance, multi-currency)
- LATAM (Spanish/Portuguese localization)

### 7.3 Technical Infrastructure Scaling

| Users | Infrastructure | Database | AI/ML |
|-------|---------------|----------|-------|
| < 10K | Vercel + Supabase | PostgreSQL (single instance) | Gemini API |
| 10K - 100K | Vercel + Railway/Render | PostgreSQL (read replicas) | Gemini API + caching |
| 100K - 1M | AWS/GCP (multi-region) | PostgreSQL (sharded) + Redis | Self-hosted models + Gemini |
| 1M+ | Multi-cloud, edge computing | Distributed database (CockroachDB) | Fine-tuned models, real-time ML |

### 7.4 Feature Scaling & Product Evolution

```
Year 1: Core Budget Tool
├── Daily allowance calculation
├── Flex bucket management
└── Basic AI logging

Year 2: Smart Financial Assistant
├── Bank sync (auto-categorization)
├── Bill prediction & alerts
├── Savings goals automation
└── Strategy Coach 2.0

Year 3: Financial Platform
├── Investment recommendations
├── Credit score integration
├── Insurance suggestions
├── Tax optimization hints

Year 4+: Financial Ecosystem
├── ledgr Pay (embedded finance)
├── ledgr Invest (robo-advisor)
├── ledgr Business (SME tools)
└── White-label solutions
```

### 7.5 Monetization Evolution

| Stage | Model | Pricing |
|-------|-------|---------|
| **Launch** | Freemium | Free core features, premium AI insights |
| **Growth** | Tiered Subscription | Free / Pro ($4.99/mo) / Family ($9.99/mo) |
| **Scale** | Diversified | Subscriptions + Affiliate revenue (financial products) |
| **Mature** | Platform Revenue | API access fees, white-label licensing, B2B SaaS |

### 7.6 Team Scaling

| Stage | Team Size | Key Hires |
|-------|-----------|-----------|
| **MVP** | 1-2 | Founder(s) only |
| **Seed** | 3-5 | +1 Engineer, +1 Designer |
| **Series A** | 10-20 | +Growth, +Data, +Customer Success |
| **Series B** | 30-50 | +Product Managers, +Regional Leads |
| **Series C+** | 100+ | Full departments, international offices |

---

## 8. Competitive Positioning

| App | Approach | ledgr Differentiator |
|-----|----------|-------------------------|
| **YNAB** | Monthly zero-based budgeting | Daily-first, auto-rebalancing removes manual reconciliation |
| **Mint** | Passive tracking & alerts | Active daily guidance—"what can I spend TODAY?" |
| **Copilot** | AI categorization | AI coaching, not just categorization |
| **Cleo** | Chat-based, Gen-Z focused | Calendar-centric, professional aesthetic |
| **Spreadsheets** | Full control, high friction | Same logic, 100x less friction |

**Positioning Statement:**
> ledgr is for people who want the intelligence of a spreadsheet with the simplicity of a daily number.

---

## 9. Success Metrics

### North Star Metric
**Daily Active Users (DAU) / Monthly Active Users (MAU) ratio** — target: > 40%

### Key Metrics by Stage

| Stage | Primary Metric | Target |
|-------|---------------|--------|
| **MVP** | Friction-to-Log (time from spending to logging) | < 3 seconds |
| **Growth** | 7-Day Retention | > 60% |
| **Scale** | Net Revenue Retention (NRR) | > 110% |
| **Mature** | Lifetime Value / Customer Acquisition Cost (LTV:CAC) | > 3:1 |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low retention after novelty wears off | High | Critical | Gamification, streaks, social accountability features |
| AI costs unsustainable at scale | Medium | High | Caching, fine-tuned smaller models, usage limits on free tier |
| Bank sync complexity & cost | High | Medium | Start with manual entry; bank sync as premium feature |
| Competition from incumbents | Medium | Medium | Focus on underserved daily-budget niche; build community moat |
| Regulatory requirements (PII, financial data) | Medium | High | Early investment in compliance; SOC 2, GDPR readiness |

---

## 11. Summary

**ledgr** is a calendar-first budgeting app that gives users one simple number each day: *what they can safely spend*. 

By starting with paycheck-to-paycheck earners—who experience the highest financial anxiety—and expanding to broader audiences, ledgr can become the default "daily spending companion" for millions.

**The path forward:**
1. Nail the core experience (MVP → 1K users)
2. Prove retention and referrals (1K → 10K users)
3. Scale acquisition channels (10K → 100K users)
4. Expand features and geographies (100K → 1M+ users)
5. Evolve into a financial platform (1M+ users)

---

*Built with ❤️ for financial freedom.*

**🌐 ledgr.app**