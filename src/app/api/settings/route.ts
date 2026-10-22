import { NextResponse } from "next/server";
import { loadBrand, loadFailsafe, saveBrand, saveFailsafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  // One round trip for the admin: business details + the offline failsafe choice.
  const [brand, failsafe] = await Promise.all([loadBrand(), loadFailsafe()]);
  return NextResponse.json({ ...brand, failsafe: failsafe.failsafe, failsafeStored: failsafe.stored });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  try {
    // PUT { brand } saves the business details, PUT { failsafe } the fallback —
    // either or both, so the two panels can't overwrite each other's settings.
    const brandInput = body?.brand ?? (body?.failsafe ? undefined : body);
    const brand = brandInput === undefined ? (await loadBrand()).brand : await saveBrand(brandInput);
    const failsafe = body?.failsafe === undefined ? (await loadFailsafe()).failsafe : await saveFailsafe(body.failsafe);
    return NextResponse.json({ brand, failsafe, stored: true, ready: true });
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
