# ledgr Feature Roadmap

Feature ideas researched from popular expense apps (YNAB, Monarch, Copilot, Spendee, Toshl, Rocket Money), fintech trends, and user feedback across Reddit/Product Hunt/app reviews.

---

## Quick Wins (1-3 days each)

### 1. Voice Input for Expenses

**Platform:** Mobile
**Description:** Mic button on the smart input modal. Speech-to-text feeds directly into the existing `parseExpenseInput` NLP parser. User says "lunch 250 at Jollibee" and it parses like typed text.
**Why:** Reduces friction for on-the-go logging. MonAI and Receiptix treat this as table-stakes.
**Implementation notes:**
- Use `expo-speech` or native Speech Recognition API
- Add mic icon button next to the sparkles icon in `smart-input.tsx`
- Pipe recognized text into `handleNlpChange` — no parser changes needed
- Add permission request for microphone access

---

### 2. Home Screen Widgets (iOS/Android)

**Platform:** Mobile
**Description:** Show today's spending total, remaining daily budget, or current streak on the home screen without opening the app.
**Why:** Keeps the app top-of-mind. YNAB, Monarch, and Copilot all offer widgets. Drives passive engagement.
**Implementation notes:**
- Use `react-native-widget-kit` or Expo widget modules
- Widget variants: daily spend summary, remaining budget, streak counter
- Read from local SQLite for instant data (no network needed)
- Update widget data on each expense log and on sync completion

---

### 3. Expense Search with Filters

**Platform:** Web + Mobile
**Description:** Search transactions by keyword, date range, amount range, and category. Optionally support natural language queries like "coffee last month over 200."
**Why:** Basic utility that's currently missing. Becomes critical as expense history grows.
**Implementation notes:**
- Web: Add search bar above expense list on dashboard, filter server-side via Supabase query
- Mobile: Full-text search on local SQLite (`LIKE` queries on label/category)
- Filter chips: date range, category, amount min/max
- Optional: pipe search query through existing NLP parser for natural language support

---

### 4. Notes & Tags on Expenses

**Platform:** Web + Mobile
**Description:** Allow free-text notes and hashtag-style tags (e.g., #trip, #work, #birthday) on any expense. Tags enable cross-category filtering without replacing the category system.
**Why:** Users want flexible grouping that doesn't fit neatly into categories. "All expenses from my Japan trip" or "all work-related meals."
**Implementation notes:**
- Add `notes` (text) column to `expenses` table
- Add `expense_tags` join table (expense_id, tag_id) and `tags` table (user_id, name)
- Parse `#tag` from smart input text (similar to existing `#category` syntax)
- Filter/search by tag across date ranges
- Mobile: store tags in local SQLite, sync with Supabase

---

### 5. Spending Alerts / Smart Notifications

**Platform:** Mobile (push), Web (in-app)
**Description:** Push notification when daily spending crosses a threshold. Examples: "You've hit 80% of today's limit", "You've spent P1,500 today — 50% above your daily average."
**Why:** Proactive awareness helps users course-correct in real time. Copilot and Monarch do this as "at-risk" budget warnings.
**Implementation notes:**
- Define alert thresholds in user settings (e.g., 50%, 80%, 100% of daily limit)
- Check thresholds after each expense submission
- Mobile: use `expo-notifications` for local push notifications (no server needed)
- Web: in-app toast/banner notification
- Optional: weekly spending pace alert ("You're on track to spend P48,000 this month")

---

### 6. Subcategories UI

**Platform:** Web + Mobile
**Description:** Allow nesting categories like Food → Groceries / Restaurants / Coffee. The database already supports this via `parent_id` on the `categories` table.
**Why:** Users consistently request this for better granularity without losing high-level rollups.
**Implementation notes:**
- Schema already has `parent_id` on `categories` — just build the UI
- Settings: show categories as expandable tree with indent
- Smart input: support `#Food/Groceries` or auto-suggest subcategories
- Insights: roll up subcategories into parent totals with drill-down
- Mobile: collapsible category picker in expense form

---

## Medium Effort (1-2 weeks each)

### 7. Receipt Photo Scanning (OCR)

**Platform:** Mobile (primary), Web (upload)
**Description:** Snap a photo of a receipt; extract merchant name, total amount, date, and line items using OCR. Auto-fill the expense form with parsed data.
**Why:** The #1 "luxury" feature users wish for. SparkReceipt claims 95% accuracy, ExpenseEasy 99.2%.
**Implementation notes:**
- Mobile: use `expo-camera` for capture, `expo-image-picker` for gallery
- OCR options: Google Cloud Vision API, Apple Vision framework, or send image to Gemini/Claude for structured extraction
- Return parsed JSON: `{ merchant, amount, date, items[] }`
- Pre-fill smart input or direct expense form
- Store receipt image URL in a new `receipt_url` column on expenses
- Supabase Storage for image hosting
- Consider on-device ML for offline scanning (Apple Vision is free, no network needed)

---

### 8. AI Chat for Insights

**Platform:** Web + Mobile
**Description:** Conversational interface where users ask questions about their spending. "How much did I spend on food last month?" / "What's my biggest category this year?" / "Compare my spending to last month."
**Why:** Natural extension of the existing AI parser. Copilot Intelligence is the benchmark. Differentiator for ledgr.
**Implementation notes:**
- New chat UI component (full-screen or slide-up modal)
- Backend: query Supabase for relevant expense data, format as context, send to LLM
- Use function calling / tool use to let the LLM query expenses, categories, budgets
- Cache common queries for speed
- Gate behind Pro subscription or credit system (already have credits infrastructure)
- Start simple: pre-defined query types before full free-form chat

---

### 9. Spending Heatmap Calendar

**Platform:** Web + Mobile
**Description:** Color-code the calendar view by spending intensity. Green = well under budget, yellow = approaching limit, red = over budget. Gives an instant visual snapshot of spending patterns across the month.
**Why:** Visual wow factor. The web app already has a `day-of-week-heatmap` in insights and a calendar view — this combines both.
**Implementation notes:**
- Calculate daily spend totals for the visible month
- Map to color scale based on daily limit (or average if no budget set)
- Web: enhance existing calendar tab with colored day cells
- Mobile: enhance `react-native-calendars` with custom day rendering
- Add legend showing color scale
- Tap a day to see expense details (already works)

---

### 10. Budget Goals per Category

**Platform:** Web + Mobile
**Description:** Set monthly spending limits per category with visual progress bars. "I want to spend no more than P5,000 on dining this month." Different from the daily allowance system — this is per-category caps.
**Why:** YNAB and Monarch feature this prominently. Users want granular budget control beyond a single daily number.
**Implementation notes:**
- New `category_budgets` table: user_id, category_id, monthly_limit, period (month/week)
- Dashboard widget showing top categories with progress bars
- Color coding: green (<70%), yellow (70-90%), red (>90%)
- Alert when approaching/exceeding category limit
- Insights: trend of category budget adherence over time
- Can coexist with the existing daily allowance / bucket system

---

### 11. Recurring Expense Detection

**Platform:** Web + Mobile
**Description:** Auto-detect spending patterns from history. "You buy Starbucks every weekday for ~P150" → offer to create a template or recurring expense. Surface detected patterns in insights.
**Why:** Monarch and Rocket Money auto-detect subscriptions. Helps users become aware of habitual spending.
**Implementation notes:**
- Batch job or on-demand analysis of expense history
- Pattern detection: same label + similar amount + regular interval
- Suggest creating a shortcut or template
- Flag potential subscriptions: "You've paid Netflix P549 monthly for 6 months"
- UI: insights section showing detected recurring expenses with total annual cost
- Can run client-side on mobile with local SQLite data

---

### 12. Bill Due Date Push Notifications

**Platform:** Mobile
**Description:** Push notification reminders for upcoming bill due dates. 3 days before, 1 day before, and day-of. The app already tracks bills/debts — just add the notification layer.
**Why:** Missed payments = late fees. Billy and Monetrail center their UX around this.
**Implementation notes:**
- Use `expo-notifications` to schedule local notifications based on debt due dates
- Schedule on app launch and after any debt/bill changes
- Notification actions: "Mark as Paid" directly from notification
- Reschedule after payment is recorded
- Settings: toggle on/off, customize reminder timing (1 day, 3 days, 1 week before)

---

### 13. PDF Spending Reports

**Platform:** Web + Mobile
**Description:** Generate a styled monthly spending report as a downloadable/shareable PDF. Include summary stats, category breakdown chart, daily spending chart, and top expenses.
**Why:** Goes beyond CSV export. Users want something they can share with a partner or save for records.
**Implementation notes:**
- Web: use a library like `@react-pdf/renderer` or server-side PDF generation
- Mobile: generate HTML → convert to PDF via `expo-print`
- Template: monthly summary header, category donut chart, daily bar chart, expense table
- Share via native share sheet on mobile
- Gate behind Pro or credit system

---

### 14. Sankey Cash Flow Diagram

**Platform:** Web (primary)
**Description:** Visualize income flowing into expense categories as a Sankey/alluvial chart. Left side: income sources. Right side: spending categories, sized by amount.
**Why:** Very shareable and visually striking. ProjectionLab and SankeyBudget have popularized this. Great for the "Year in Review" concept too.
**Implementation notes:**
- Use D3.js sankey plugin or a React wrapper like `recharts` with sankey support
- Data: income entries → category totals for selected period
- Interactive: hover to highlight flows, click to drill down
- Monthly or yearly view toggle
- Could be a Pro insight or a standalone page
- Consider: savings as a "category" showing money not spent

---

## Large Effort (3+ weeks each)

### 15. Bank Account Linking

**Platform:** Web + Mobile
**Description:** Auto-import transactions from bank accounts via Plaid, Mono (for PH banks), or similar Open Banking APIs. Eliminates manual entry for linked accounts.
**Why:** The single most-requested feature across all expense trackers. Monarch, YNAB, and Copilot rely on this. Game-changer for user retention.
**Implementation notes:**
- Integration partner: Plaid (US/global), Mono (Philippines), or Brankas (SEA)
- New tables: `linked_accounts`, `imported_transactions`
- Deduplication: match imported transactions against manually entered expenses
- Auto-categorization of imported transactions (see feature #20)
- Webhook for real-time transaction notifications
- Security: encrypted credentials, token refresh, PCI compliance considerations
- Pricing: Plaid charges per connection — factor into subscription tiers
- Start with read-only transaction import, no transfers

---

### 16. Shared Wallets / Couples & Family Mode

**Platform:** Web + Mobile
**Description:** Multiple users sharing a single budget/wallet view. See combined spending, split between personal and shared expenses, partner invitations.
**Why:** Spendee, Monarch, and Tandem differentiate on this. Couples managing household finances is a huge use case.
**Implementation notes:**
- New tables: `wallets` (shared entity), `wallet_members`, `wallet_expenses`
- Invitation flow: email invite → accept → join wallet
- Permissions: viewer vs editor
- Expenses can be "personal" or assigned to a shared wallet
- Shared dashboard showing combined spending
- Each member sees their contribution vs partner's
- Sync complexity: both users' changes must merge correctly
- Consider: family mode with parent/child accounts and allowances

---

### 17. Expense Splitting

**Platform:** Web + Mobile
**Description:** Split a bill among friends. Track who owes whom and settle up. Lighter than Splitwise but integrated into the expense tracking flow.
**Why:** Frequently requested on Reddit. Natural extension of expense logging — "I paid P2,000 for dinner for 4 people."
**Implementation notes:**
- New tables: `splits` (expense_id, split_with_user_or_name, amount, settled)
- Quick split options: equal, percentage, custom amounts
- "Split" button on expense detail view
- Balance summary: net amounts owed to/from each person
- Settle up: mark splits as paid
- Optional: invite friends to ledgr for two-way tracking
- Start simple: just track amounts, no payment integration

---

### 18. Multi-Currency with Live Exchange Rates

**Platform:** Web + Mobile
**Description:** Log expenses in different currencies while traveling. Auto-convert to home currency using live exchange rates. View expenses in original or converted amounts.
**Why:** Essential for travelers. Toshl supports 200 currencies with hourly rate updates.
**Implementation notes:**
- Add `original_currency` and `original_amount` columns to expenses
- Exchange rate API: Open Exchange Rates, Fixer.io, or free alternatives
- Cache rates locally (update daily is sufficient for expense tracking)
- Currency picker on expense input (default to home currency)
- Display: show both original and converted amounts
- Reports: aggregate in home currency with conversion footnotes
- Mobile: cache exchange rates for offline use
- Trip mode: auto-switch default currency based on location or manual toggle

---

### 19. Gamification System

**Platform:** Web + Mobile
**Description:** Badges, XP, weekly challenges, and streaks beyond the existing streak counter. Drive habit formation through game mechanics.
**Why:** Research shows gamified finance apps see 47% higher 90-day retention and 3.2x longer sessions.
**Implementation notes:**
- New tables: `achievements` (definitions), `user_achievements` (unlocked), `challenges`
- **Badges:** "First expense", "7-day streak", "Under budget all week", "100 expenses logged", "No-spend day", "Category master" (used all categories)
- **XP/Levels:** Points for logging expenses, staying under budget, maintaining streaks
- **Weekly challenges:** "Keep dining under P2,000 this week", "Log every expense for 5 days straight"
- **Visual:** Badge showcase on profile, level indicator, challenge progress bars
- Notifications for badge unlocks and challenge completions
- Keep it tasteful — this is a finance app, not a game. Subtle, rewarding, not annoying
- Consider: opt-in leaderboard comparing savings rates (anonymous)

---

### 20. Smart Auto-Categorization (ML)

**Platform:** Web + Mobile
**Description:** Learn from the user's categorization patterns and auto-suggest or auto-assign categories for new expenses. After ~30 categorized transactions, start predicting.
**Why:** Copilot Intelligence does this. Reduces friction as the app learns the user's habits.
**Implementation notes:**
- Feature vector: label text (tokenized), amount range, time of day, day of week
- Simple approach: label → most-used-category lookup table (no ML needed for v1)
- Advanced: TF-IDF on labels + nearest neighbor classification
- Train per-user model on their categorized expenses
- Show suggestion with confidence: "Food? ✓ ✗" — user confirms or corrects
- Corrections feed back into the model
- Mobile: run inference locally for offline support
- Start with the simple lookup approach — covers 80% of cases

---

### 21. Spending Forecasting / Projections

**Platform:** Web + Mobile
**Description:** ML-based prediction: "Based on your patterns, you'll spend P45,000 this month." Alert when projected spending exceeds budget. Show trajectory on a chart.
**Why:** Copilot does this with "at-risk" budget indicators. Proactive rather than reactive budgeting.
**Implementation notes:**
- Simple v1: linear projection from current month's daily average × remaining days
- Advanced: factor in day-of-week patterns, recurring expenses, seasonal trends
- Visualization: projected line extending from actual spending on cumulative chart
- Confidence interval: show optimistic/pessimistic range
- Alert: "At current pace, you'll exceed your P40,000 budget by P5,000"
- Integrate with existing cumulative spending chart in insights

---

### 22. Apple Watch / Wear OS Companion

**Platform:** Mobile (extension)
**Description:** Quick expense entry from the wrist via voice or complications. Show daily total on the watch face.
**Why:** Minimum friction logging. Budget App and Spending Tracker both offer this.
**Implementation notes:**
- Expo doesn't natively support watch apps — may need native Swift/Kotlin modules
- Watch app features: voice input → parse → log, daily total complication, recent expenses list
- Communication: WatchConnectivity framework (iOS) to sync with phone app
- Consider: start with iOS only (Apple Watch has larger market share for finance apps)
- Alternative: Siri Shortcuts integration as a lighter approach ("Hey Siri, log coffee 150 in ledgr")

---

## Fun / Shareable Ideas

### Year-in-Review "Wrapped"

**Platform:** Web + Mobile
**Description:** Annual spending summary inspired by Spotify Wrapped. Animated slides showing: total spent, top categories, biggest single expense, most frequent merchant, streak records, month-over-month trends.
**Why:** Highly shareable on social media. Free marketing. Users love reflection.
**Effort:** Medium (1-2 weeks). Generate static data, build animated card sequence.

### Debt Payoff Simulator

**Platform:** Web
**Description:** Snowball vs avalanche calculator using existing debt data. "If you pay P500 extra/month, you'll be debt-free 8 months sooner and save P12,000 in interest."
**Why:** Already have the debts table. Natural extension. High perceived value.
**Effort:** Medium (1 week). Pure frontend calculation + visualization.

### No-Spend Day Challenges

**Platform:** Web + Mobile
**Description:** Challenge users to have zero-spend days. Track and celebrate them. "You've had 4 no-spend days this month — that's P2,400 saved!"
**Why:** Simple gamification that directly encourages saving. Easy to implement on top of existing data.
**Effort:** Quick win (1-2 days). Check if daily total = 0, show badge/celebration.

---

## Suggested Implementation Order

Based on impact, effort, and building on existing infrastructure:

**Phase 1 — Quick Wins (next 2-4 weeks)**
1. Voice Input (mobile)
2. Subcategories UI (web + mobile)
3. Expense Search + Filters (web + mobile)
4. No-Spend Day Challenges (web + mobile)

**Phase 2 — Core Value (1-2 months)**
5. Receipt Scanning / OCR (mobile)
6. Budget Goals per Category (web + mobile)
7. Spending Heatmap Calendar (web + mobile)
8. Bill Due Date Notifications (mobile)
9. Notes & Tags (web + mobile)

**Phase 3 — Differentiators (2-3 months)**
10. AI Chat for Insights (web + mobile)
11. Gamification System (web + mobile)
12. Recurring Expense Detection (web + mobile)
13. PDF Reports (web + mobile)

**Phase 4 — Big Bets (3-6 months)**
14. Smart Auto-Categorization (web + mobile)
15. Multi-Currency + Live Rates (web + mobile)
16. Spending Forecasting (web + mobile)
17. Bank Account Linking (web + mobile)

**Phase 5 — Social & Expansion (6+ months)**
18. Shared Wallets / Couples Mode (web + mobile)
19. Expense Splitting (web + mobile)
20. Year-in-Review Wrapped (web + mobile)
21. Apple Watch Companion (mobile)
