import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_BRAND, normalizeBrand, type BrandSettings } from "@/lib/brand";
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
