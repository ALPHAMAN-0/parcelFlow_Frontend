import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ApiStatusFooter } from '@/components/layout/ApiStatusFooter';
import { ColdStartBanner } from '@/components/ui/ColdStartBanner';
import { Button } from '@/components/ui/Button';
import { STATUS_LABELS, STATUS_ORDER, STATUS_DESCRIPTIONS, STATUS_STYLES } from '@/domain/parcelStatus';
import { DEMO_ACCOUNTS } from './demoAccounts';

const ROLE_CARDS = [
  {
    title: 'Customers',
    body: 'Create parcels, watch them move, and read the full history of who changed what and when. You see your own parcels and nothing else.',
    icon: 'M12 5v14m-7-7h14',
  },
  {
    title: 'Delivery staff',
    body: 'A queue of the parcels assigned to you, each with a single next action. The flow is linear, so there is never a choice to get wrong.',
    icon: 'm9 6 6 6-6 6',
  },
  {
    title: 'Admins',
    body: 'Every parcel, every user. Assign couriers, promote and demote roles, and read live delivery statistics computed in the database.',
    icon: 'M3 3v18h18M8 17V9m5 8V5m5 12v-6',
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <ColdStartBanner />

      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="bg-brand-600 flex size-7 items-center justify-center rounded-lg">
              <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l8 4v10l-8 4-8-4V7l8-4Zm0 0v18M4 7l8 4 8-4" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-bold tracking-tight">ParcelFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register" className="hidden sm:block">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20">
          <div className="max-w-2xl">
            <p className="text-brand-600 dark:text-brand-400 mb-3 text-xs font-semibold tracking-wide uppercase">
              Parcel delivery management
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every parcel, every status change, on the record.
            </h1>
            <p className="text-muted mt-4 text-sm leading-relaxed sm:text-base">
              Customers create parcels. Admins assign couriers. Delivery staff move each parcel
              through a fixed sequence of states. Every transition is written to an append-only
              history table, so the question is never{' '}
              <em>what happened to this parcel</em> — it is already answered.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">Create an account</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Status flow */}
        <section className="surface-sunken border-y border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-bold tracking-tight">The status flow</h2>
            <p className="text-muted mt-1.5 max-w-2xl text-xs leading-relaxed">
              Strictly linear, with four legal moves out of the twenty-five pairs the five states
              could otherwise form. A parcel cannot skip a step, go backwards, or be set to the
              status it already has — that last one would put a meaningless row in the audit trail.
            </p>

            <ol className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {STATUS_ORDER.map((status, i) => (
                <li
                  key={status}
                  className="surface relative rounded-xl p-4 ring-1 ring-[var(--border-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${STATUS_STYLES[status].dot}`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="text-xs font-semibold">{STATUS_LABELS[status]}</h3>
                  </div>
                  <p className="text-muted mt-2 text-[11px] leading-relaxed">
                    {STATUS_DESCRIPTIONS[status]}
                  </p>
                  {i === STATUS_ORDER.length - 1 && (
                    <span className="mt-2 inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Terminal
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-lg font-bold tracking-tight">Three roles, three views</h2>
          <p className="text-muted mt-1.5 max-w-2xl text-xs leading-relaxed">
            Visibility is enforced in the database query, not filtered after the fact — a record
            outside your scope never leaves the server. Someone else's parcel returns "not found"
            rather than "forbidden", because "forbidden" would confirm it exists.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {ROLE_CARDS.map((card) => (
              <div key={card.title} className="surface rounded-xl p-5 ring-1 ring-[var(--border-subtle)]">
                <span className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 mb-3 flex size-9 items-center justify-center rounded-lg">
                  <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={card.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold">{card.title}</h3>
                <p className="text-muted mt-1.5 text-xs leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo accounts */}
        {DEMO_ACCOUNTS.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
            <div className="surface rounded-xl p-5 ring-1 ring-[var(--border-subtle)]">
              <h2 className="text-sm font-bold tracking-tight">Try it with seeded data</h2>
              <p className="text-muted mt-1 text-xs leading-relaxed">
                The demo database is seeded with seven parcels — one in each status, each with a
                complete history trail. Sign in as any role; the sign-in page fills these for you.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[26rem] text-xs">
                  <thead>
                    <tr className="text-muted text-left text-[10px] tracking-wide uppercase">
                      <th className="pb-2 font-semibold">Role</th>
                      <th className="pb-2 font-semibold">Email</th>
                      <th className="pb-2 font-semibold">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_ACCOUNTS.map((account) => (
                      <tr key={account.email} className="border-t border-[var(--border-subtle)]">
                        <td className="py-2 pr-4 font-medium whitespace-nowrap">{account.label}</td>
                        <td className="py-2 pr-4 font-mono whitespace-nowrap">{account.email}</td>
                        <td className="py-2 font-mono whitespace-nowrap">{account.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-muted mt-4 text-[11px] leading-relaxed">
                Tracking a parcel needs an account: the lookup is scoped to what your role can see,
                so there is no public tracking page by design.
              </p>

              <Link to="/login" className="mt-4 inline-block">
                <Button size="sm">Sign in and look around</Button>
              </Link>
            </div>
          </section>
        )}
      </main>

      <ApiStatusFooter />
    </div>
  );
}
