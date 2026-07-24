import { login } from "@/app/auth/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const isSupabaseConfigured = hasSupabaseConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f2] px-6 py-12 text-slate-950">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
            Student Life OS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sign in to your workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Access your student dashboard, finance summaries, career tracker,
            and productivity overview.
          </p>
        </div>

        <form
          action={login}
          className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          {!isSupabaseConfigured ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add your Supabase URL and public key to `.env.local` before
              signing in.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={!isSupabaseConfigured}
            className="h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
