/**
 * The seeded accounts on the deployed backend.
 *
 * Verified against the live API rather than copied from its README — the README
 * documents `123`, but the deployment was seeded from its own .env, so the real
 * passwords are these.
 *
 * SECURITY NOTE: this list is published to anyone who opens the site, and it
 * includes the admin, who can change roles and reassign any parcel. That is the
 * intent for a portfolio demo — a reviewer should be able to click in and look
 * around. To lock it down, delete the ADMIN entry (or the whole array; the UI
 * hides the panel when it is empty).
 */
export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Admin', email: 'admin@parcelflow.dev', password: 'admin123' },
  { label: 'Delivery staff', email: 'rahim.staff@parcelflow.dev', password: 'staff123' },
  { label: 'Customer', email: 'ayesha.customer@parcelflow.dev', password: 'customer123' },
];
