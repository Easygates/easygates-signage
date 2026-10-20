import { NextResponse } from "next/server";
import { loadBrand, saveBrand } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await loadBrand());
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  try {
    const brand = await saveBrand(body?.brand ?? body);
    return NextResponse.json({ brand, stored: true, ready: true });
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
