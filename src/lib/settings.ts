import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import {
  DEFAULT_BRAND,
  defaultBusinesses,
  normalizeBrand,
  normalizeBusinesses,
  type BrandSettings,
  type BusinessCollection,
} from "@/lib/brand";
import { DEFAULT_FAILSAFE, normalizeFailsafe, type FailsafeSettings } from "@/lib/failsafe";

/** Saved business details, or the defaults. `ready` is false when the settings table is missing. */
export async function loadBrand(): Promise<{ brand: BrandSettings; stored: boolean; ready: boolean }> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "brand")).limit(1);
    return { brand: normalizeBrand(rows[0]?.value), stored: Boolean(rows[0]), ready: true };
  } catch {
    return { brand: DEFAULT_BRAND, stored: false, ready: false };
  }
}

export async function saveBrand(input: unknown): Promise<BrandSettings> {
  const brand = normalizeBrand(input);
  const value = brand as unknown as Record<string, unknown>;
  await db
    .insert(settings)
    .values({ key: "brand", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  return brand;
}

/**
 * The list of businesses. `stored` is false when nothing has been saved yet —
 * the caller then gets the two shipped presets so the admin has something to edit.
 * The legacy single-business row is migrated into the first profile on first read.
 */
export async function loadBusinesses(): Promise<{ businesses: BusinessCollection; stored: boolean; ready: boolean }> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "businesses")).limit(1);
    if (rows[0]) return { businesses: normalizeBusinesses(rows[0].value), stored: true, ready: true };
    // Nothing saved yet: seed from the legacy brand row if there is one, else the presets.
    const legacy = await loadBrand();
    if (legacy.stored) return { businesses: normalizeBusinesses(null, legacy.brand), stored: false, ready: true };
    return { businesses: defaultBusinesses(), stored: false, ready: true };
  } catch {
    return { businesses: defaultBusinesses(), stored: false, ready: false };
  }
}

export async function saveBusinesses(input: unknown): Promise<BusinessCollection> {
  const businesses = normalizeBusinesses(input);
  const value = businesses as unknown as Record<string, unknown>;
  await db
    .insert(settings)
    .values({ key: "businesses", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  return businesses;
}

/** What a screen should show when the CMS can't be reached. Defaults to "last playlist it played". */
export async function loadFailsafe(): Promise<{ failsafe: FailsafeSettings; stored: boolean }> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "failsafe")).limit(1);
    return { failsafe: normalizeFailsafe(rows[0]?.value), stored: Boolean(rows[0]) };
  } catch {
    // No database — the built-in pack is what a screen will fall back to anyway.
    return { failsafe: DEFAULT_FAILSAFE, stored: false };
  }
}

export async function saveFailsafe(input: unknown): Promise<FailsafeSettings> {
  const failsafe = normalizeFailsafe(input);
  const value = failsafe as unknown as Record<string, unknown>;
  await db
    .insert(settings)
    .values({ key: "failsafe", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  return failsafe;
}
