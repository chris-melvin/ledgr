export const CURRENCY = "₱";
export const DEFAULT_DAILY_LIMIT = 300;

// Using Lucide icon names instead of emojis for better compatibility
export const TEMPLATES = [
  { id: "t1", label: "Coffee", amount: 120, icon: "Coffee" },
  { id: "t2", label: "Commute", amount: 45, icon: "Bus" },
  { id: "t3", label: "Lunch", amount: 180, icon: "Utensils" },
  { id: "t4", label: "Dinner", amount: 250, icon: "UtensilsCrossed" },
  { id: "t5", label: "Snack", amount: 60, icon: "Apple" },
  { id: "t6", label: "Grab", amount: 180, icon: "Bike" },
  { id: "t7", label: "Groceries", amount: 500, icon: "ShoppingCart" },
  { id: "t8", label: "Shopping", amount: 300, icon: "ShoppingBag" },
] as const;

export type Template = (typeof TEMPLATES)[number];
