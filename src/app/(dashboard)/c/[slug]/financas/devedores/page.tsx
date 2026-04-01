import { redirect } from "next/navigation";

// Devedores data is available via the "Devedores" tab on the Quotas page.
// This route is not in sidebar navigation; redirect to avoid orphaned pages.
export default async function DebtorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/c/${slug}/financas/quotas`);
}
