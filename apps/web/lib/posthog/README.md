# PostHog Integration Guide

PostHog is fully integrated into ledgr for comprehensive analytics and feature flagging.

## Setup Complete ✅

The following components are already configured:

### 1. Environment Variables
Located in `/apps/web/.env.local`:
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Important:** Never commit your actual PostHog API key to version control. Keep it in `.env.local` which should be in your `.gitignore`.

### 2. Provider Setup
- `PostHogProvider` wraps the entire app in `/apps/web/app/layout.tsx`
- Automatic pageview tracking on route changes
- Instrumentation hook enabled for server-side tracking

### 3. Proxy Configuration
PostHog requests are proxied through `/ingest` to avoid ad blockers:
- `/ingest/static/*` → PostHog assets
- `/ingest/*` → PostHog API

## Usage

### Client-Side Tracking

#### Track Custom Events
```tsx
import { trackEvent } from "@/lib/posthog";

// Simple event
trackEvent("button_clicked");

// Event with properties
trackEvent("expense_added", {
  amount: 150,
  category: "food",
  method: "manual",
});
```

#### Identify Users (After Login)
```tsx
import { identifyUser, setUserProperties } from "@/lib/posthog";

// Identify user
identifyUser(user.id, {
  email: user.email,
  name: user.name,
  plan: "pro",
});

// Update user properties later
setUserProperties({
  total_expenses: 42,
  last_active: new Date().toISOString(),
});
```

#### Reset on Logout
```tsx
import { resetUser } from "@/lib/posthog";

// Call this when user logs out
resetUser();
```

#### Feature Flags
```tsx
import { isFeatureEnabled, getFeatureFlag } from "@/lib/posthog";

// Boolean flag
if (isFeatureEnabled("new_dashboard")) {
  return <NewDashboard />;
}

// String/multivariate flag
const theme = getFeatureFlag("theme_variant");
```

#### Direct PostHog Access
```tsx
import { posthog } from "@/lib/posthog";

// Access the full PostHog client
posthog.capture("custom_event", { foo: "bar" });
```

### Server-Side Tracking

For API routes and server actions:

```ts
import { getPostHogClient } from "@/lib/posthog-server";

export async function someServerAction() {
  const posthog = getPostHogClient();

  posthog.capture({
    distinctId: userId,
    event: "server_action_completed",
    properties: {
      success: true,
    },
  });

  // PostHog automatically flushes on shutdown
}
```

## Automatic Tracking

The following events are tracked automatically:

### Pageviews
- Every route change captures a `$pageview` event
- Includes full URL with query parameters

### Exceptions
- Unhandled errors are captured via `capture_exceptions: true`
- Visible in PostHog's Error Tracking dashboard

### Page Leave
- Tracks when users navigate away (`capture_pageleave: true`)

## Existing Event Tracking

PostHog is already integrated in these components:

1. **Checkout Flow** (`checkout-button.tsx`)
   - Tracks checkout initiation
   - Monitors payment success/failure

2. **Expense Tracking** (`expense-modal.tsx`)
   - Captures expense creation events
   - Tracks editing and deletion

3. **Budget Setup** (`budget-setup-page.tsx`)
   - Monitors onboarding completion
   - Tracks setup steps

4. **Authentication** (`login/page.tsx`, `signup/page.tsx`)
   - Captures login/signup events
   - Tracks auth method (Google OAuth)

5. **Feature Voting** (`vote-button.tsx`)
   - Tracks roadmap feature votes
   - Monitors user engagement

6. **Webhooks** (`api/webhooks/payments/route.ts`)
   - Server-side subscription events
   - Payment success/failure tracking

## Best Practices

### Event Naming
Use descriptive, snake_case names:
```ts
// ✅ Good
trackEvent("expense_created");
trackEvent("budget_limit_exceeded");
trackEvent("export_pdf_clicked");

// ❌ Avoid
trackEvent("click");
trackEvent("Event1");
trackEvent("userDidSomething");
```

### Event Properties
Include relevant context:
```ts
trackEvent("expense_created", {
  amount: 150,
  category: "food",
  bucket: "daily_spend",
  input_method: "quick_add", // vs "modal"
  user_plan: "pro",
});
```

### Performance
PostHog batches events automatically. Don't worry about calling `trackEvent` frequently - it won't impact performance.

### Privacy
- Only track anonymized or aggregated data where possible
- Never track sensitive information (passwords, credit cards, etc.)
- Respect user privacy preferences
- PostHog is configured to only create person profiles for identified users (`person_profiles: "identified_only"`)

## Debugging

Enable debug mode in development:
```tsx
// Already configured in posthog-provider.tsx
debug: process.env.NODE_ENV === "development"
```

Check browser console for PostHog logs during development.

## PostHog Dashboard

Access your PostHog dashboard at:
- **URL**: https://us.i.posthog.com

### Key Dashboards to Set Up
1. **User Engagement** - DAU/WAU/MAU, session duration
2. **Conversion Funnels** - Signup → Setup → First Expense → Pro Upgrade
3. **Feature Usage** - Which features are most used
4. **Retention Cohorts** - User retention over time
5. **Revenue Tracking** - Pro subscriptions, MRR

## Troubleshooting

### Events not appearing?
1. Check browser console for PostHog logs (development mode)
2. Verify environment variables are set
3. Check PostHog dashboard filters (may be showing wrong date range)
4. Ensure provider is wrapping your app in layout.tsx

### Ad blockers interfering?
Events should go through the `/ingest` proxy, which bypasses most ad blockers. If issues persist:
- Test in incognito mode
- Check Network tab for failed `/ingest` requests
- Verify proxy configuration in `next.config.js`

### Server-side tracking not working?
- Ensure `instrumentationHook` is enabled in `next.config.js`
- Check that environment variables are available server-side
- Server events may take a few minutes to appear in PostHog

## Additional Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)
- [Feature Flags Guide](https://posthog.com/docs/feature-flags)
- [Event Tracking Best Practices](https://posthog.com/docs/integrate/client/js#tracking-events)
