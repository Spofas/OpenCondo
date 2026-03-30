import { redirect } from "next/navigation";

export default async function RecurringExpensesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/c/${slug}/financas/despesas`);
}
