import { describe, it, expect } from "vitest";
import { parseTopUp } from "@/components/expenses/smart-input-bar";

describe("parseTopUp", () => {
  it("parses a leading + amount with optional note", () => {
    expect(parseTopUp("+5000")).toEqual({ amount: 5000, note: null });
    expect(parseTopUp("+5000 gcash")).toEqual({ amount: 5000, note: "gcash" });
    expect(parseTopUp("+ 1500 salary")).toEqual({ amount: 1500, note: "salary" });
    expect(parseTopUp("+₱2000")).toEqual({ amount: 2000, note: null });
  });

  it("parses the 'top up' keyword variants", () => {
    expect(parseTopUp("top up 3000")).toEqual({ amount: 3000, note: null });
    expect(parseTopUp("topup 3000 payday")).toEqual({
      amount: 3000,
      note: "payday",
    });
    expect(parseTopUp("top-up 250.50")).toEqual({ amount: 250.5, note: null });
  });

  it("returns null for normal expenses and junk", () => {
    expect(parseTopUp("coffee 120")).toBeNull();
    expect(parseTopUp("grab 180 and lunch")).toBeNull();
    expect(parseTopUp("+abc")).toBeNull();
    expect(parseTopUp("")).toBeNull();
    expect(parseTopUp("+0")).toBeNull();
    expect(parseTopUp("topped up yesterday")).toBeNull();
  });
});
