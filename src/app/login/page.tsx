// Server component: reads the `from` search param without touching `window`,
// so the page prerenders without a Suspense boundary.
import LoginForm from "./login-form";

export default function LoginPage({ searchParams }: { searchParams?: { from?: string } }) {
  const from = searchParams?.from || "/admin";
  return <LoginForm from={from} />;
}
