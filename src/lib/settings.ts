import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_BRAND, normalizeBrand, type BrandSettings } from "@/lib/brand";

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
