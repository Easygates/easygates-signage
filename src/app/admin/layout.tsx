import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const open = !process.env.ADMIN_PASSWORD;
  return (
    <>
      {open && (
        <div className="bg-amber-400 px-5 py-2.5 text-center text-sm font-bold text-black">
          Admin is not password protected - anyone on your network can edit these screens. To turn on the login,
          add <code className="rounded bg-black/10 px-1.5 py-0.5">ADMIN_PASSWORD=your-password</code> to your .env file and restart.
        </div>
      )}
      {children}
    </>
  );
}
