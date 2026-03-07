import { createClient } from "@/lib/supabase/server";
import { PricingContent } from "./pricing-content";

export const metadata = {
  title: "Pricing - ledgr",
  description: "Simple, transparent pricing. Choose the plan that works for you.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PricingContent isLoggedIn={!!user} userEmail={user?.email} />;
}
