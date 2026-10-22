import { NextResponse } from "next/server";
import { loadBrand, loadBusinesses, loadFailsafe, saveBrand, saveBusinesses, saveFailsafe } from "@/lib/settings";
import type { BusinessCollection } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function GET() {
  // One round trip for the admin: the business list, the legacy single-business
  // details (still what screens read when no business is chosen) and the failsafe.
  const [brand, businesses, failsafe] = await Promise.all([loadBrand(), loadBusinesses(), loadFailsafe()]);
  return NextResponse.json({
    ...brand,
    businesses: businesses.businesses,
    businessesStored: businesses.stored,
    businessesReady: businesses.ready,
    failsafe: failsafe.failsafe,
    failsafeStored: failsafe.stored,
  });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  try {
    // PUT { brand } saves the single business details, PUT { businesses } the list,
    // PUT { failsafe } the fallback — any combination, so the panels on the admin
    // page can each save their own slice without overwriting each other.
    const brandInput = body?.brand ?? (body?.failsafe || body?.businesses ? undefined : body);
    const brand = brandInput === undefined ? (await loadBrand()).brand : await saveBrand(brandInput);
    let businesses: BusinessCollection;
    if (body?.businesses === undefined) {
      businesses = (await loadBusinesses()).businesses;
    } else {
      businesses = await saveBusinesses(body.businesses);
      // Keep the legacy single-business row in step with the active business, so
      // everything that still reads `brand` (the player, exports) shows that one.
      const active = businesses.profiles.find((p) => p.id === businesses.activeId) ?? businesses.profiles[0];
      if (active) await saveBrand(active);
    }
    const failsafe = body?.failsafe === undefined ? (await loadFailsafe()).failsafe : await saveFailsafe(body.failsafe);
    return NextResponse.json({ brand, businesses, failsafe, stored: true, ready: true });
  } catch (err) {
    const missing = /relation .*settings.* does not exist/i.test(err instanceof Error ? err.message : "");
    return NextResponse.json(
      {
        error: missing
          ? "The settings table doesn't exist yet — run supabase/schema.sql in the Supabase SQL Editor."
          : "Couldn't save the business settings.",
      },
      { status: 500 }
    );
  }
}
