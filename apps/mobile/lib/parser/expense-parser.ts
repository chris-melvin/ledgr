import { TEMPLATES } from "@repo/shared/constants";

export interface ParsedExpense {
  amount: number;
  label: string;
  category?: string;
  fromShortcut?: string;
  parsedTime?: {
    hours?: number;
    minutes?: number;
    date?: Date;
  };
}

export interface ShortcutEntry {
  trigger_word: string;
  label: string;
  category: string | null;
  default_amount: number | null;
}

// #category pattern
const CATEGORY_PATTERN = /#([a-zA-Z][a-zA-Z0-9]*)/g;

// Template shortcuts for instant parsing
const TEMPLATE_MAP = new Map(
  TEMPLATES.map((t) => [t.label.toLowerCase(), { amount: t.amount, label: t.label }])
);

// Common shortcuts
const SHORTCUTS: Record<string, { label: string; multiplier?: number }> = {
  "both ways": { label: "Commute", multiplier: 2 },
  roundtrip: { label: "Commute", multiplier: 2 },
  "round trip": { label: "Commute", multiplier: 2 },
};

/**
 * Extract time/date tokens from natural language input.
 * Handles "at 2pm", "at 2:30pm", "at 14:00", "yesterday", "last friday".
 */
export function extractTimeTokens(input: string): {
  parsedTime?: { hours?: number; minutes?: number; date?: Date };
  remaining: string;
} {
  let remaining = input;
  let hours: number | undefined;
  let minutes: number | undefined;
  let date: Date | undefined;

  // Match "at <time>" patterns: "at 2pm", "at 2:30pm", "at 14:00"
  const timeMatch = remaining.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]!, 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem) {
      if (meridiem === "pm" && h < 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      hours = h;
      minutes = m;
      remaining = remaining.replace(timeMatch[0], " ").trim();
    } else if (timeMatch[2]) {
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hours = h;
        minutes = m;
        remaining = remaining.replace(timeMatch[0], " ").trim();
      }
    }
  }

  // Match "yesterday"
  const yesterdayMatch = remaining.match(/\byesterday\b/i);
  if (yesterdayMatch) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    date = d;
    remaining = remaining.replace(yesterdayMatch[0], " ").trim();
  }

  // Match "last <day>"
  if (!date) {
    const lastDayMatch = remaining.match(
      /\blast\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i
    );
    if (lastDayMatch) {
      const dayMap: Record<string, number> = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6,
      };
      const targetDay = dayMap[lastDayMatch[1]!.toLowerCase()];
      if (targetDay !== undefined) {
        const d = new Date();
        const currentDay = d.getDay();
        let diff = currentDay - targetDay;
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        date = d;
      }
      remaining = remaining.replace(lastDayMatch[0], " ").trim();
    }
  }

  if (hours !== undefined || date) {
    return { parsedTime: { hours, minutes, date }, remaining };
  }

  return { remaining };
}

/**
 * Extract #category from input.
 */
function extractCategory(input: string): {
  category?: string;
  remaining: string;
} {
  const match = input.match(CATEGORY_PATTERN);
  if (match && match[0]) {
    const category = match[0].slice(1); // Remove # prefix
    return {
      category,
      remaining: input.replace(match[0], "").trim(),
    };
  }
  return { remaining: input };
}

/**
 * Parse simple patterns like "coffee 120", "grab 180 and lunch".
 * Token-based: split by whitespace, find pure-number tokens,
 * take the LAST one as price. Everything else is the label.
 */
export function parseSimplePatterns(input: string): ParsedExpense[] {
  const results: ParsedExpense[] = [];

  // Split by "and", "&", ","
  const parts = input.split(/\s+(?:and|&)\s+|,\s*/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if it's just a template name
    const templateMatch = TEMPLATE_MAP.get(trimmed.toLowerCase());
    if (templateMatch) {
      results.push({
        amount: templateMatch.amount,
        label: templateMatch.label,
      });
      continue;
    }

    // Token-based parsing
    const tokens = trimmed.split(/\s+/);
    const numberTokenIndices: number[] = [];

    tokens.forEach((token, i) => {
      const cleaned = token.replace(/[₱$]/g, "");
      if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
        numberTokenIndices.push(i);
      }
    });

    if (numberTokenIndices.length > 0) {
      const priceIndex = numberTokenIndices[numberTokenIndices.length - 1]!;
      const priceToken = tokens[priceIndex]!.replace(/[₱$]/g, "");
      const amount = parseFloat(priceToken);

      const labelTokens = tokens.filter((_, i) => i !== priceIndex);
      const labelPart = labelTokens.join(" ").trim();

      const template = TEMPLATE_MAP.get(labelPart.toLowerCase());

      results.push({
        amount,
        label: template ? template.label : labelPart || "Expense",
        category: template?.label,
      });
    }
  }

  return results;
}

/**
 * Parse @shortcut patterns: "@book 500" → resolved from shortcut map
 */
function parseShortcutPattern(
  input: string,
  shortcutMap: Map<string, ShortcutEntry>
): { parsed: ParsedExpense | null; remaining: string } {
  const match = input.match(/@(\w+)\s+(\d+(?:\.\d+)?)/);
  if (!match) return { parsed: null, remaining: input };

  const trigger = match[1]?.toLowerCase() || "";
  const amount = parseFloat(match[2] || "0");
  const remaining = input.replace(match[0], "").trim();

  const shortcut = shortcutMap.get(trigger);
  if (shortcut) {
    return {
      parsed: {
        amount,
        label: shortcut.label,
        category: shortcut.category ?? undefined,
        fromShortcut: trigger,
      },
      remaining,
    };
  }

  // Unknown shortcut — still parse with trigger as label
  return {
    parsed: {
      amount,
      label: trigger.charAt(0).toUpperCase() + trigger.slice(1),
      fromShortcut: trigger,
    },
    remaining,
  };
}

/**
 * Main local parser. Extracts category, time tokens, @shortcuts, then patterns.
 * Pass shortcutMap for @shortcut support.
 * Returns null if nothing could be parsed.
 */
export function parseExpenseInput(
  input: string,
  shortcutMap?: Map<string, ShortcutEntry>
): ParsedExpense[] | null {
  let workingInput = input;

  // Step 1: Extract #category
  const { category: explicitCategory, remaining: afterCategory } = extractCategory(workingInput);
  workingInput = afterCategory;

  // Step 2: Extract time/date tokens
  const { parsedTime, remaining: afterTime } = extractTimeTokens(workingInput);
  workingInput = afterTime;

  // Step 3: Check for @shortcuts
  if (workingInput.includes("@") && shortcutMap) {
    const { parsed, remaining } = parseShortcutPattern(workingInput, shortcutMap);
    if (parsed) {
      const results: ParsedExpense[] = [{
        ...parsed,
        category: explicitCategory ?? parsed.category,
        parsedTime,
      }];
      if (remaining) {
        const moreResults = parseSimplePatterns(remaining);
        results.push(
          ...moreResults.map((r) => ({
            ...r,
            category: explicitCategory ?? r.category,
            parsedTime,
          }))
        );
      }
      return results;
    }
  }

  const normalized = workingInput.toLowerCase().trim();

  // Step 4: Check for built-in shortcuts (both ways, roundtrip)
  for (const [shortcut, config] of Object.entries(SHORTCUTS)) {
    if (normalized.includes(shortcut)) {
      const results: ParsedExpense[] = [];
      const template = TEMPLATE_MAP.get(config.label.toLowerCase());
      if (template) {
        const count = config.multiplier || 1;
        for (let i = 0; i < count; i++) {
          results.push({
            amount: template.amount,
            label: template.label,
            category: explicitCategory,
            parsedTime,
          });
        }
      }
      // Parse remaining after removing shortcut
      const remaining = normalized.replace(shortcut, "").trim();
      if (remaining) {
        const moreResults = parseSimplePatterns(remaining);
        results.push(
          ...moreResults.map((r) => ({
            ...r,
            category: explicitCategory ?? r.category,
            parsedTime,
          }))
        );
      }
      return results.length > 0 ? results : null;
    }
  }

  // Step 4: Try simple patterns
  const simpleResults = parseSimplePatterns(normalized);
  if (simpleResults.length > 0) {
    return simpleResults.map((r) => ({
      ...r,
      category: explicitCategory ?? r.category,
      parsedTime,
    }));
  }

  return null;
}
