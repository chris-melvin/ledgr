"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { assetRepository } from "@/lib/repositories";
import type { Asset, AssetType } from "@repo/database";

export interface AccountWithType {
  id: string;
  name: string;
  type: AssetType;
  balance: number;
  institution: string | null;
  accountNumber: string | null;
  notes: string | null;
  isLiquid: boolean;
  createdAt: string;
  updatedAt: string;
  displayType: string;
}

const typeDisplayNames: Record<AssetType, string> = {
  cash: "Cash",
  investment: "Investment",
  property: "Property",
  vehicle: "Vehicle",
  crypto: "Crypto",
  retirement: "Retirement",
  other: "Other",
};

/**
 * Get all assets (accounts) for the current user
 */
export async function getAssets(): Promise<ActionResult<AccountWithType[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const assets = await assetRepository.findAll(supabase, userId);

    const accounts: AccountWithType[] = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      balance: Number(asset.balance),
      institution: asset.institution,
      accountNumber: asset.account_number,
      notes: asset.notes,
      isLiquid: asset.is_liquid,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
      displayType: typeDisplayNames[asset.type],
    }));

    return success(accounts);
  } catch (err) {
    console.error("Failed to get assets:", err);
    return error("Failed to get accounts", "DATABASE_ERROR");
  }
}

/**
 * Get assets by type
 */
export async function getAssetsByType(
  type: AssetType
): Promise<ActionResult<Asset[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const assets = await assetRepository.findByType(supabase, userId, type);
    return success(assets);
  } catch (err) {
    console.error("Failed to get assets by type:", err);
    return error("Failed to get accounts", "DATABASE_ERROR");
  }
}

/**
 * Get a single asset by ID
 */
export async function getAsset(assetId: string): Promise<ActionResult<Asset>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const asset = await assetRepository.findById(supabase, assetId, userId);
    if (!asset) {
      return error("Account not found", "NOT_FOUND");
    }
    return success(asset);
  } catch (err) {
    console.error("Failed to get asset:", err);
    return error("Failed to get account", "DATABASE_ERROR");
  }
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  balance?: number;
  institution?: string | null;
  accountNumber?: string | null;
  notes?: string | null;
  isLiquid?: boolean;
}

/**
 * Create a new asset (account)
 */
export async function createAsset(
  input: CreateAssetInput
): Promise<ActionResult<Asset>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // Validation
  if (!input.name?.trim()) {
    return error("Account name is required", "VALIDATION_ERROR");
  }
  if (!input.type) {
    return error("Account type is required", "VALIDATION_ERROR");
  }

  // Auto-determine if liquid based on type
  const isLiquid =
    input.isLiquid ?? ["cash", "investment", "crypto"].includes(input.type);

  try {
    const asset = await assetRepository.create(supabase, {
      user_id: userId,
      name: input.name.trim(),
      type: input.type,
      balance: input.balance ?? 0,
      institution: input.institution ?? null,
      account_number: input.accountNumber ?? null,
      notes: input.notes ?? null,
      is_liquid: isLiquid,
    });

    return success(asset);
  } catch (err) {
    console.error("Failed to create asset:", err);
    return error("Failed to create account", "DATABASE_ERROR");
  }
}

export interface UpdateAssetInput {
  name?: string;
  balance?: number;
  institution?: string | null;
  accountNumber?: string | null;
  notes?: string | null;
  isLiquid?: boolean;
}

/**
 * Update an asset (account)
 */
export async function updateAsset(
  assetId: string,
  input: UpdateAssetInput
): Promise<ActionResult<Asset>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const existing = await assetRepository.findById(supabase, assetId, userId);
    if (!existing) {
      return error("Account not found", "NOT_FOUND");
    }

    const update: Record<string, unknown> = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.balance !== undefined) update.balance = input.balance;
    if (input.institution !== undefined) update.institution = input.institution;
    if (input.accountNumber !== undefined)
      update.account_number = input.accountNumber;
    if (input.notes !== undefined) update.notes = input.notes;
    if (input.isLiquid !== undefined) update.is_liquid = input.isLiquid;

    const asset = await assetRepository.update(supabase, assetId, userId, update);
    return success(asset);
  } catch (err) {
    console.error("Failed to update asset:", err);
    return error("Failed to update account", "DATABASE_ERROR");
  }
}

/**
 * Quick update account balance
 */
export async function updateAssetBalance(
  assetId: string,
  newBalance: number
): Promise<ActionResult<Asset>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const asset = await assetRepository.updateBalance(
      supabase,
      assetId,
      userId,
      newBalance
    );
    return success(asset);
  } catch (err) {
    console.error("Failed to update asset balance:", err);
    return error("Failed to update balance", "DATABASE_ERROR");
  }
}

/**
 * Delete an asset (account)
 */
export async function deleteAsset(assetId: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const existing = await assetRepository.findById(supabase, assetId, userId);
    if (!existing) {
      return error("Account not found", "NOT_FOUND");
    }

    await assetRepository.delete(supabase, assetId, userId);
    return success(undefined);
  } catch (err) {
    console.error("Failed to delete asset:", err);
    return error("Failed to delete account", "DATABASE_ERROR");
  }
}

export interface AssetSummary {
  totalBalance: number;
  liquidBalance: number;
  investmentBalance: number;
  byType: Record<AssetType, number>;
  accountCount: number;
}

/**
 * Get assets summary for dashboard
 */
export async function getAssetsSummary(): Promise<ActionResult<AssetSummary>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const assets = await assetRepository.findAll(supabase, userId);

    const totalBalance = assets.reduce((sum, a) => sum + Number(a.balance), 0);
    const liquidBalance = assets
      .filter((a) => a.is_liquid)
      .reduce((sum, a) => sum + Number(a.balance), 0);
    const investmentBalance = assets
      .filter((a) => a.type === "investment" || a.type === "retirement")
      .reduce((sum, a) => sum + Number(a.balance), 0);

    const byType: Record<AssetType, number> = {
      cash: 0,
      investment: 0,
      property: 0,
      vehicle: 0,
      crypto: 0,
      retirement: 0,
      other: 0,
    };

    for (const asset of assets) {
      byType[asset.type] += Number(asset.balance);
    }

    return success({
      totalBalance,
      liquidBalance,
      investmentBalance,
      byType,
      accountCount: assets.length,
    });
  } catch (err) {
    console.error("Failed to get assets summary:", err);
    return error("Failed to get accounts summary", "DATABASE_ERROR");
  }
}
