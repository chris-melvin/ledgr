/**
 * Paddle Payment Provider Implementation
 *
 * Implements the PaymentProvider interface for Paddle Billing.
 * https://developer.paddle.com/api-reference/overview
 */

import crypto from "crypto";
import type { BillingCycle, SubscriptionStatus } from "@repo/database";
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSession,
  PortalSession,
  PaymentEvent,
  OneTimePaymentEvent,
  ProviderSubscription,
} from "../types";
import { PADDLE_CONFIG, getCreditPack } from "../config";

export class PaddleProvider implements PaymentProvider {
  readonly name = "paddle" as const;

  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = PADDLE_CONFIG.apiKey;
    this.webhookSecret = PADDLE_CONFIG.webhookSecret;
    this.baseUrl =
      PADDLE_CONFIG.environment === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
    const priceId =
      params.billingCycle === "monthly"
        ? PADDLE_CONFIG.monthlyPriceId
        : PADDLE_CONFIG.yearlyPriceId;

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer: {
          email: params.email,
        },
        custom_data: {
          userId: params.userId,
        },
        checkout: {
          url: params.successUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Paddle checkout error:", error);
      throw new Error("Failed to create Paddle checkout");
    }

    const data = await response.json();

    return {
      checkoutUrl: data.data.checkout?.url ?? "",
      sessionId: data.data.id,
    };
  }

  /**
   * Create checkout for one-time credit pack purchase
   */
  async createCreditPackCheckout(params: {
    userId: string;
    email: string;
    packId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const pack = getCreditPack(params.packId);
    if (!pack || !pack.paddlePriceId) {
      throw new Error(`Invalid credit pack: ${params.packId}`);
    }

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: pack.paddlePriceId, quantity: 1 }],
        customer: {
          email: params.email,
        },
        custom_data: {
          userId: params.userId,
          packId: params.packId,
          type: "credit_pack",
        },
        checkout: {
          url: params.successUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Paddle credit pack checkout error:", error);
      throw new Error("Failed to create credit pack checkout");
    }

    const data = await response.json();

    return {
      checkoutUrl: data.data.checkout?.url ?? "",
      sessionId: data.data.id,
    };
  }

  /**
   * Get customer portal URL
   */
  async getPortalUrl(providerCustomerId: string): Promise<PortalSession> {
    // Paddle Billing: create a portal session via API
    const response = await fetch(
      `${this.baseUrl}/customers/${providerCustomerId}/portal-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      console.error("Failed to create portal session:", response.status, errorBody);
      throw new Error("Unable to open billing portal. Please manage your subscription from Settings.");
    }

    const data = await response.json();
    const portalUrl = data.data?.urls?.general?.overview ?? data.data?.urls?.general ?? data.data?.url;

    if (!portalUrl) {
      throw new Error("Billing portal URL not available. Please try again later.");
    }

    return { portalUrl };
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/subscriptions/${providerSubscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "next_billing_period",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Paddle cancel error:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  /**
   * Resume a cancelled subscription
   */
  async resumeSubscription(providerSubscriptionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/subscriptions/${providerSubscriptionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduled_change: null, // Remove scheduled cancellation
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Paddle resume error:", error);
      throw new Error("Failed to resume subscription");
    }
  }

  /**
   * Parse and verify webhook
   */
  async parseWebhook(
    payload: string,
    signature: string
  ): Promise<PaymentEvent | OneTimePaymentEvent | null> {
    // Verify signature
    if (!this.verifySignature(payload, signature)) {
      console.error("Invalid Paddle webhook signature");
      return null;
    }

    try {
      const data = JSON.parse(payload);
      const eventType = data.event_type;

      // Handle one-time payment (credit pack)
      if (
        eventType === "transaction.completed" &&
        data.data.custom_data?.type === "credit_pack"
      ) {
        return this.normalizeOneTimeEvent(data);
      }

      // Handle subscription events
      if (eventType.startsWith("subscription.")) {
        return this.normalizeSubscriptionEvent(data);
      }

      console.log("Unhandled Paddle event:", eventType);
      return null;
    } catch (error) {
      console.error("Failed to parse Paddle webhook:", error);
      return null;
    }
  }

  /**
   * Get subscription from Paddle API
   */
  async getSubscription(
    providerSubscriptionId: string
  ): Promise<ProviderSubscription | null> {
    const response = await fetch(
      `${this.baseUrl}/subscriptions/${providerSubscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const sub = data.data;

    return {
      providerSubscriptionId: sub.id,
      providerCustomerId: sub.customer_id,
      status: this.mapStatus(sub.status),
      billingCycle: this.mapBillingCycle(sub.billing_cycle?.interval),
      currentPeriodStart: new Date(sub.current_billing_period?.starts_at),
      currentPeriodEnd: new Date(sub.current_billing_period?.ends_at),
      cancelAtPeriodEnd: sub.scheduled_change?.action === "cancel",
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Verify Paddle webhook signature
   * https://developer.paddle.com/webhooks/signature-verification
   */
  private verifySignature(payload: string, signature: string): boolean {
    if (!signature || !this.webhookSecret) {
      return false;
    }

    try {
      // Paddle signature format: ts=timestamp;h1=hash
      const parts: Record<string, string> = {};
      signature.split(";").forEach((part) => {
        const [key, value] = part.split("=");
        if (key && value) {
          parts[key] = value;
        }
      });

      const ts = parts.ts;
      const h1 = parts.h1;

      if (!ts || !h1) {
        return false;
      }

      const signedPayload = `${ts}:${payload}`;
      const expectedSig = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedPayload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(h1),
        Buffer.from(expectedSig)
      );
    } catch {
      return false;
    }
  }

  /**
   * Normalize subscription webhook event
   */
  private normalizeSubscriptionEvent(data: Record<string, unknown>): PaymentEvent {
    const eventType = data.event_type as string;
    const eventId = data.event_id as string | undefined;
    const occurredAt = data.occurred_at as string | undefined;
    const sub = data.data as Record<string, unknown>;

    const billingPeriod = sub.current_billing_period as Record<string, string> | undefined;
    const billingCycle = sub.billing_cycle as Record<string, string> | undefined;
    const scheduledChange = sub.scheduled_change as Record<string, string> | undefined;
    const customData = sub.custom_data as Record<string, unknown> | undefined;

    return {
      type: this.mapEventType(eventType),
      eventId,
      occurredAt,
      providerSubscriptionId: sub.id as string,
      providerCustomerId: sub.customer_id as string,
      status: this.mapStatus(sub.status as string),
      billingCycle: this.mapBillingCycle(billingCycle?.interval),
      currentPeriodStart: new Date(billingPeriod?.starts_at ?? Date.now()),
      currentPeriodEnd: new Date(billingPeriod?.ends_at ?? Date.now()),
      cancelAtPeriodEnd: scheduledChange?.action === "cancel",
      customData: customData ?? {},
      rawPayload: data,
    };
  }

  /**
   * Normalize one-time payment event (credit pack)
   */
  private normalizeOneTimeEvent(data: Record<string, unknown>): OneTimePaymentEvent {
    const eventId = data.event_id as string | undefined;
    const occurredAt = data.occurred_at as string | undefined;
    const transaction = data.data as Record<string, unknown>;
    const customData = transaction.custom_data as Record<string, unknown> | undefined;

    return {
      type: "one_time.completed",
      eventId,
      occurredAt,
      providerTransactionId: transaction.id as string,
      providerCustomerId: transaction.customer_id as string,
      productId: customData?.packId as string,
      customData: customData ?? {},
      rawPayload: data,
    };
  }

  /**
   * Map Paddle event type to our normalized type
   */
  private mapEventType(eventType: string): PaymentEvent["type"] {
    const mapping: Record<string, PaymentEvent["type"]> = {
      "subscription.created": "subscription.created",
      "subscription.updated": "subscription.updated",
      "subscription.canceled": "subscription.cancelled",
      "subscription.cancelled": "subscription.cancelled",
      "subscription.activated": "subscription.created",
      "subscription.past_due": "subscription.payment_failed",
      "subscription.paused": "subscription.updated",
      "subscription.resumed": "subscription.updated",
      "transaction.completed": "subscription.payment_succeeded",
      "transaction.payment_failed": "subscription.payment_failed",
    };
    return mapping[eventType] ?? "subscription.updated";
  }

  /**
   * Map Paddle status to our normalized status
   */
  private mapStatus(status: string): SubscriptionStatus {
    const mapping: Record<string, SubscriptionStatus> = {
      active: "active",
      trialing: "trialing",
      past_due: "past_due",
      paused: "paused",
      canceled: "cancelled",
      cancelled: "cancelled",
    };
    return mapping[status] ?? "expired";
  }

  /**
   * Map Paddle billing interval to our billing cycle
   */
  private mapBillingCycle(interval?: string): BillingCycle {
    return interval === "year" ? "yearly" : "monthly";
  }
}
