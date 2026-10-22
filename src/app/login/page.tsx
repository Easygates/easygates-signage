// Server component: reads the `from` search param without touching `window`,
// so the page prerenders without a Suspense boundary.
import LoginForm from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ from?: string }> }) {
  const raw = (await searchParams)?.from;
  // only ever redirect to a path on this site
  const from = raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/admin";
  return <LoginForm from={from} />;
}
