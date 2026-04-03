"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { subscriptionRepository } from "@/lib/repositories";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Permanently delete the current user's account and all associated data.
 * Cancels any active Paddle subscription before deletion.
 */
export async function deleteAccount(): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    // Cancel active Paddle subscription if exists
    const subscription = await subscriptionRepository.getByUserId(supabase, userId);
    if (
      subscription &&
      subscription.status !== "cancelled" &&
      subscription.status !== "expired"
    ) {
      try {
        const provider = getPaymentProvider();
        await provider.cancelSubscription(subscription.provider_subscription_id);
      } catch (cancelErr) {
        console.error("Failed to cancel subscription during account deletion:", cancelErr);
        // Continue with deletion — subscription will expire on its own
      }
    }

    // Delete user via RPC (cascades all data)
    const { error: rpcError } = await supabase.rpc("delete_own_account");
    if (rpcError) throw rpcError;

    // Explicitly invalidate the session
    await supabase.auth.signOut();

    return success(undefined);
  } catch (err) {
    console.error("Failed to delete account:", err);
    return error(
      "Failed to delete account. Please try again or contact support.",
      "INTERNAL_ERROR"
    );
  }
}
