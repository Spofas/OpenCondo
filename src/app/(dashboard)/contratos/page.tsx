import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { ContractPageClient } from "./contract-page-client";

export default async function ContractsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const contracts = await db.contract.findMany({
    where: { condominiumId: membership.condominiumId },
    include: {
      supplier: { select: { name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  const serializedContracts = contracts.map((c) => ({
    id: c.id,
    description: c.description,
    type: c.type,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate?.toISOString() || null,
    renewalType: c.renewalType,
    annualCost: Number(c.annualCost),
    paymentFrequency: c.paymentFrequency,
    status: c.status,
    policyNumber: c.policyNumber,
    insuredValue: c.insuredValue ? Number(c.insuredValue) : null,
    coverageType: c.coverageType,
    notes: c.notes,
    supplierName: c.supplier?.name || null,
  }));

  return (
    <ContractPageClient
      contracts={serializedContracts}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
