import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { subscriptionRepository, settingsRepository } from "@/lib/repositories";
import { PADDLE_CONFIG } from "@/lib/payments/config";

/**
 * POST /api/subscription/sync
 *
 * Manually sync subscription status from Paddle for the authenticated user.
 * Use this when webhooks fail and retries are exhausted.
 *
 * Flow:
 * 1. Get authenticated user
 * 2. Search Paddle customers by email
 * 3. List subscriptions for that customer
 * 4. Upsert subscription in local DB
 * 5. Update user_settings tier
 */
export async function POST() {
  // 1. Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl =
    PADDLE_CONFIG.environment === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";
  const apiKey = PADDLE_CONFIG.apiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Paddle API key not configured" },
      { status: 500 }
    );
  }

  try {
    // 2. Search Paddle customers by email
    const customerRes = await fetch(
      `${baseUrl}/customers?email=${encodeURIComponent(user.email)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!customerRes.ok) {
      const err = await customerRes.json();
      console.error("Paddle customer search failed:", err);
      return NextResponse.json(
        { error: "Failed to search Paddle customers" },
        { status: 500 }
      );
    }

    const customerData = await customerRes.json();
    const customers = customerData.data ?? [];

    if (customers.length === 0) {
      return NextResponse.json(
        { error: "No Paddle customer found for your email" },
        { status: 404 }
      );
    }

    // 3. List subscriptions for each customer (usually just one)
    let activeSub = null;

    for (const customer of customers) {
      const subRes = await fetch(
        `${baseUrl}/subscriptions?customer_id=${customer.id}&status=active,trialing,past_due`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (!subRes.ok) continue;

      const subData = await subRes.json();
      const subs = subData.data ?? [];

      if (subs.length > 0) {
        activeSub = subs[0];
        activeSub._customerId = customer.id;
        break;
      }
    }

    if (!activeSub) {
      return NextResponse.json(
        { error: "No active subscription found in Paddle" },
        { status: 404 }
      );
    }

    // 4. Upsert subscription in local DB
    const serviceClient = createServiceClient();

    const billingCycle =
      activeSub.billing_cycle?.interval === "year" ? "yearly" : "monthly";

    await subscriptionRepository.upsert(serviceClient, {
      user_id: user.id,
      provider: "paddle",
      provider_subscription_id: activeSub.id,
      provider_customer_id: activeSub._customerId,
      status: activeSub.status === "active" ? "active" : activeSub.status,
      billing_cycle: billingCycle,
      current_period_start:
        activeSub.current_billing_period?.starts_at ?? new Date().toISOString(),
      current_period_end:
        activeSub.current_billing_period?.ends_at ?? new Date().toISOString(),
      cancel_at_period_end:
        activeSub.scheduled_change?.action === "cancel",
    });

    // 5. Update user settings tier
    await settingsRepository.upsert(serviceClient, user.id, {
      subscription_tier: "pro",
    } as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      subscription: {
        id: activeSub.id,
        status: activeSub.status,
        billingCycle,
        currentPeriodEnd: activeSub.current_billing_period?.ends_at,
      },
    });
  } catch (error) {
    console.error("Subscription sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
