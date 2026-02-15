"use client";

import { useState, useCallback, useMemo } from "react";
import { TEMPLATES } from "@/lib/constants";
import type { CustomShortcut } from "@/lib/types";
import type { BudgetBucket } from "@repo/database";

export interface ParsedExpense {
  amount: number;
  label: string;
  category?: string;
  bucketId?: string;      // Resolved bucket ID
  bucketSlug?: string;    // For display (e.g., "flex", "daily-spending")
  fromShortcut?: string;  // The @keyword that was used
}

export interface UnknownShortcut {
  trigger: string; // e.g., "book"
  amount: number; // The amount typed with it
}

interface UseAiParserOptions {
  onSuccess?: (expenses: ParsedExpense[]) => void | Promise<void>;
  onError?: (error: Error) => void;
  onUnknownShortcut?: (shortcut: UnknownShortcut) => void;
  shortcuts?: CustomShortcut[];
  buckets?: BudgetBucket[];
  defaultBucketId?: string;
}

// Patterns for bucket and category extraction
// :bucket pattern - matches :word or :word-word (e.g., :flex, :daily-spending)
const BUCKET_PATTERN = /:([a-z][a-z0-9-]*)/gi;
// #category pattern - matches #word (e.g., #travel, #food)
const CATEGORY_PATTERN = /#([a-zA-Z][a-zA-Z0-9]*)/g;

// Template shortcuts for instant parsing
const TEMPLATE_MAP = new Map(
  TEMPLATES.map((t) => [t.label.toLowerCase(), { amount: t.amount, label: t.label }])
);

// Common shortcuts
const SHORTCUTS: Record<string, { amount?: number; label: string; multiplier?: number }> = {
  "both ways": { label: "Commute", multiplier: 2 },
  "roundtrip": { label: "Commute", multiplier: 2 },
  "round trip": { label: "Commute", multiplier: 2 },
};

export function useAiParser({
  onSuccess,
  onError,
  onUnknownShortcut,
  shortcuts = [],
  buckets = [],
  defaultBucketId,
}: UseAiParserOptions = {}) {
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedExpense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingShortcut, setPendingShortcut] = useState<UnknownShortcut | null>(null);

  // Build shortcut map from custom shortcuts - memoized to update when shortcuts change
  const shortcutMap = useMemo(
    () => new Map(shortcuts.map((s) => [s.trigger.toLowerCase(), s])),
    [shortcuts]
  );

  // Build bucket map for quick lookup by slug AND name
  const bucketMap = useMemo(() => {
    const map = new Map<string, BudgetBucket>();
    buckets.forEach((b) => {
      // Add by slug
      map.set(b.slug.toLowerCase(), b);
      // Also add by name (lowercase, spaces replaced with hyphens)
      const nameKey = b.name.toLowerCase().replace(/\s+/g, "-");
      if (!map.has(nameKey)) {
        map.set(nameKey, b);
      }
      // Also add by name without spaces
      const nameKeyNoSpaces = b.name.toLowerCase().replace(/\s+/g, "");
      if (!map.has(nameKeyNoSpaces)) {
        map.set(nameKeyNoSpaces, b);
      }
    });
    return map;
  }, [buckets]);

  // Get default bucket
  const defaultBucket = useMemo(() => {
    if (defaultBucketId) {
      return buckets.find((b) => b.id === defaultBucketId);
    }
    return buckets.find((b) => b.is_default) ?? buckets[0];
  }, [buckets, defaultBucketId]);

  // Extract :bucket from input and return { bucketSlug, bucketId, remaining }
  const extractBucket = useCallback((input: string): {
    bucketSlug?: string;
    bucketId?: string;
    remaining: string;
  } => {
    // Skip bucket extraction when no buckets are configured
    if (bucketMap.size === 0) {
      return { remaining: input };
    }

    const match = input.match(BUCKET_PATTERN);
    if (match && match[0]) {
      const slug = match[0].slice(1).toLowerCase(); // Remove : prefix
      const bucket = bucketMap.get(slug);

      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("[useAiParser] Bucket pattern found:", match[0]);
        console.log("[useAiParser] Looking for slug:", slug);
        console.log("[useAiParser] Available buckets:", Array.from(bucketMap.keys()));
        console.log("[useAiParser] Found bucket:", bucket);
      }

      if (bucket) {
        return {
          bucketSlug: bucket.slug,
          bucketId: bucket.id,
          remaining: input.replace(match[0], "").trim(),
        };
      }
      // Even if bucket not found, still remove the pattern from input
      // and use the typed slug as bucketSlug (for display purposes)
      return {
        bucketSlug: slug, // Show what user typed even if not matched
        remaining: input.replace(match[0], "").trim(),
      };
    }
    return { remaining: input };
  }, [bucketMap]);

  // Extract #category from input and return { category, remaining }
  const extractCategory = useCallback((input: string): {
    category?: string;
    remaining: string;
  } => {
    const match = input.match(CATEGORY_PATTERN);
    if (match && match[0]) {
      const category = match[0].slice(1); // Remove # prefix, keep original case
      return {
        category,
        remaining: input.replace(match[0], "").trim(),
      };
    }
    return { remaining: input };
  }, []);

  // Parse @keyword patterns: "@book 500" → { trigger: "book", amount: 500 }
  const parseShortcutPattern = useCallback((input: string): { parsed: ParsedExpense | null; unknown: UnknownShortcut | null; remaining: string } => {
    // Match @keyword followed by amount
    const match = input.match(/@(\w+)\s+(\d+(?:\.\d+)?)/);
    if (!match) {
      return { parsed: null, unknown: null, remaining: input };
    }

    const trigger = match[1]?.toLowerCase() || "";
    const amount = parseFloat(match[2] || "0");
    const remaining = input.replace(match[0], "").trim();

    // Look up in custom shortcuts
    const shortcut = shortcutMap.get(trigger);
    if (shortcut) {
      // Get bucket from shortcut's default or look up by slug
      let bucketId = shortcut.defaultBucketId;
      let bucketSlug = shortcut.defaultBucketSlug;

      if (bucketSlug && !bucketId) {
        const bucket = bucketMap.get(bucketSlug.toLowerCase());
        if (bucket) {
          bucketId = bucket.id;
        }
      }

      return {
        parsed: {
          amount,
          label: shortcut.label,
          category: shortcut.category,
          bucketId,
          bucketSlug,
          fromShortcut: trigger,
        },
        unknown: null,
        remaining,
      };
    }

    // Unknown shortcut - flag for creation
    return {
      parsed: null,
      unknown: { trigger, amount },
      remaining,
    };
  }, [shortcutMap, bucketMap]);

  // Local parsing for templates and shortcuts (instant, no API needed)
  const parseLocally = useCallback((input: string): ParsedExpense[] | null => {
    let workingInput = input;
    const results: ParsedExpense[] = [];

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[parseLocally] Input:", input);
    }

    // Step 1: Extract :bucket pattern (applies to all expenses in this input)
    const { bucketSlug, bucketId, remaining: afterBucket } = extractBucket(workingInput);
    workingInput = afterBucket;

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[parseLocally] After bucket extraction:", { bucketSlug, bucketId, remaining: afterBucket });
    }

    // Step 2: Extract #category pattern (applies to all expenses in this input)
    const { category: explicitCategory, remaining: afterCategory } = extractCategory(workingInput);
    workingInput = afterCategory;

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[parseLocally] After category extraction:", { category: explicitCategory, remaining: afterCategory });
    }

    const normalized = workingInput.toLowerCase().trim();

    // Step 3: Check for @keyword patterns
    if (workingInput.includes("@")) {
      const { parsed, unknown, remaining } = parseShortcutPattern(workingInput);

      if (unknown) {
        // Store pending shortcut for UI to handle
        setPendingShortcut(unknown);
        onUnknownShortcut?.(unknown);
        return null; // Don't process further until shortcut is created
      }

      if (parsed) {
        // Apply explicit bucket/category if provided, otherwise use shortcut defaults
        results.push({
          ...parsed,
          bucketId: bucketId ?? parsed.bucketId,
          bucketSlug: bucketSlug ?? parsed.bucketSlug,
          category: explicitCategory ?? parsed.category,
        });
        setPendingShortcut(null);

        // Continue parsing remaining input if any
        if (remaining) {
          const moreResults = parseSimplePatterns(remaining);
          // Apply bucket/category to all parsed results
          results.push(...moreResults.map((r) => ({
            ...r,
            bucketId: bucketId ?? r.bucketId,
            bucketSlug: bucketSlug ?? r.bucketSlug,
            category: explicitCategory ?? r.category,
          })));
        }

        return results.length > 0 ? results : null;
      }
    }

    setPendingShortcut(null);

    // Step 4: Check for built-in shortcuts (both ways, roundtrip)
    for (const [shortcut, config] of Object.entries(SHORTCUTS)) {
      if (normalized.includes(shortcut)) {
        const template = TEMPLATE_MAP.get(config.label.toLowerCase());
        if (template) {
          const count = config.multiplier || 1;
          for (let i = 0; i < count; i++) {
            results.push({
              amount: template.amount,
              label: template.label,
              bucketId,
              bucketSlug,
              category: explicitCategory,
            });
          }
        }
        // Remove the shortcut from input for further parsing
        const remaining = normalized.replace(shortcut, "").trim();
        if (remaining) {
          // Continue parsing the rest
          const moreResults = parseSimplePatterns(remaining);
          results.push(...moreResults.map((r) => ({
            ...r,
            bucketId: bucketId ?? r.bucketId,
            bucketSlug: bucketSlug ?? r.bucketSlug,
            category: explicitCategory ?? r.category,
          })));
        }
        return results.length > 0 ? results : null;
      }
    }

    // Step 5: Try simple patterns
    const simpleResults = parseSimplePatterns(normalized);
    if (process.env.NODE_ENV === "development") {
      console.log("[parseLocally] Simple patterns result:", simpleResults);
    }
    if (simpleResults.length > 0) {
      // Apply bucket/category to all parsed results
      const finalResults = simpleResults.map((r) => ({
        ...r,
        bucketId: bucketId ?? r.bucketId,
        bucketSlug: bucketSlug ?? r.bucketSlug,
        category: explicitCategory ?? r.category,
      }));
      if (process.env.NODE_ENV === "development") {
        console.log("[parseLocally] Final results:", finalResults);
      }
      return finalResults;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[parseLocally] No results, returning null");
    }
    return null;
  }, [parseShortcutPattern, onUnknownShortcut, extractBucket, extractCategory]);

  // Parse simple patterns like "coffee 120" or "grab 180 and lunch"
  // Uses token-based approach: split by whitespace, find pure-number tokens,
  // take the LAST one as price. Everything else is the label.
  const parseSimplePatterns = (input: string): ParsedExpense[] => {
    const results: ParsedExpense[] = [];

    // Split by "and", "&", ","
    const parts = input.split(/\s+(?:and|&)\s+|,\s*/);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Check if it's just a template name (case-insensitive)
      const templateMatch = TEMPLATE_MAP.get(trimmed.toLowerCase());
      if (templateMatch) {
        results.push({
          amount: templateMatch.amount,
          label: templateMatch.label,
        });
        continue;
      }

      // Token-based parsing: split by whitespace, find pure-number tokens
      // A pure-number token is one that is entirely a number (e.g., "120", "50.5")
      // Tokens like "ps5", "7-eleven", "iphone15" are NOT pure numbers
      const tokens = trimmed.split(/\s+/);
      const numberTokenIndices: number[] = [];

      tokens.forEach((token, i) => {
        // Strip currency symbols before checking
        const cleaned = token.replace(/[₱$]/g, "");
        if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
          numberTokenIndices.push(i);
        }
      });

      if (numberTokenIndices.length > 0) {
        // Take the LAST pure-number token as the price
        const priceIndex = numberTokenIndices[numberTokenIndices.length - 1]!;
        const priceToken = tokens[priceIndex]!.replace(/[₱$]/g, "");
        const amount = parseFloat(priceToken);

        // Everything else is the label
        const labelTokens = tokens.filter((_, i) => i !== priceIndex);
        const labelPart = labelTokens.join(" ").trim();

        // Check if label matches a template (use template label but user's amount)
        const template = TEMPLATE_MAP.get(labelPart.toLowerCase());

        results.push({
          amount,  // Always use user-provided amount
          label: template ? template.label : labelPart || "Expense",
          category: template?.label,
        });
      }
    }

    return results;
  };

  // AI parsing using Gemini (for complex inputs)
  const parseWithAi = useCallback(async (input: string): Promise<ParsedExpense[]> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const systemPrompt = `You are a financial expense parser. Extract expenses from natural language input.
Return a JSON array of objects with: { amount: number, label: string, category?: string }

Rules:
- If a number is mentioned, use it as the amount
- If no number but a known category (coffee, lunch, commute, snack), use common Filipino prices:
  - Coffee: 120
  - Commute: 45
  - Lunch: 180
  - Snack: 60
  - Grab/GrabFood: 180
  - Dinner: 250
- "both ways" or "roundtrip" means double the amount
- Split multiple items mentioned (e.g., "coffee and lunch" = 2 expenses)
- Currency is PHP (₱), ignore currency symbols in input

Examples:
"grab 180 and coffee" → [{"amount":180,"label":"GrabFood"},{"amount":120,"label":"Coffee"}]
"commute both ways" → [{"amount":45,"label":"Commute"},{"amount":45,"label":"Commute"}]
"spent 500 on dinner" → [{"amount":500,"label":"Dinner"}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("AI parsing failed");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  }, []);

  // Main parse function - tries local first, falls back to AI
  const parse = useCallback(
    async (input: string): Promise<ParsedExpense[]> => {
      if (!input.trim()) {
        setPreview([]);
        return [];
      }

      setError(null);

      // Try local parsing first (instant)
      const localResult = parseLocally(input);
      if (localResult && localResult.length > 0) {
        setPreview(localResult);
        return localResult;
      }

      // Fall back to AI parsing
      setIsParsing(true);
      try {
        const aiResult = await parseWithAi(input);
        setPreview(aiResult);
        return aiResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Parsing failed");
        setError(error.message);
        onError?.(error);
        return [];
      } finally {
        setIsParsing(false);
      }
    },
    [parseLocally, parseWithAi, onError]
  );

  // Submit and clear
  const submit = useCallback(async (input: string) => {
    const results = await parse(input);
    if (results.length > 0) {
      // Apply default bucket to expenses that don't have one
      const withDefaults = results.map((expense) => ({
        ...expense,
        bucketId: expense.bucketId ?? defaultBucket?.id,
        bucketSlug: expense.bucketSlug ?? defaultBucket?.slug,
      }));
      await onSuccess?.(withDefaults);
      setPreview([]);
    }
    return results;
  }, [parse, onSuccess, defaultBucket]);

  // Real-time preview (local only for speed)
  const updatePreview = useCallback((input: string) => {
    if (!input.trim()) {
      setPreview([]);
      return;
    }
    const localResult = parseLocally(input);
    setPreview(localResult || []);
  }, [parseLocally]);

  const clearPreview = useCallback(() => {
    setPreview([]);
    setError(null);
  }, []);

  // Clear pending shortcut
  const clearPendingShortcut = useCallback(() => {
    setPendingShortcut(null);
  }, []);

  // Update a specific preview item (for changing bucket/category via UI)
  const updatePreviewItem = useCallback((index: number, updates: Partial<ParsedExpense>) => {
    setPreview((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const item = updated[index];
      if (item) {
        updated[index] = { ...item, ...updates };
      }
      return updated;
    });
  }, []);

  return {
    parse,
    submit,
    updatePreview,
    updatePreviewItem,
    clearPreview,
    clearPendingShortcut,
    preview,
    isParsing,
    error,
    pendingShortcut,
    defaultBucket,
  };
}
