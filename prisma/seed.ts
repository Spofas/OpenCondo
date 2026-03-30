/**
 * Database seed for manual testing.
 *
 * Creates a realistic condominium ("Edifício Aurora") with:
 * - 1 admin user, 3 owner users, 1 tenant user
 * - 6 units with permilagem totalling 1000
 * - 1 approved budget (2026) with 4 line items
 * - 12 months of quotas (mix of PAID, PENDING, OVERDUE)
 * - Transaction records for all paid quotas and expenses (Livro de Caixa)
 * - 8 expenses across different categories
 * - 2 recurring expense templates
 * - 3 announcements (one pinned, different categories)
 * - 2 maintenance requests (different statuses)
 * - 1 completed meeting with attendance, votes, and ata
 * - 1 upcoming meeting
 * - 2 contracts (one active, one expired)
 * - 2 suppliers
 * - 2 documents
 * - 1 pending invite
 *
 * Login credentials:
 *   Admin:  admin@aurora.pt     / password123
 *   Owner:  joao@example.com    / password123
 *   Owner:  maria@example.com   / password123
 *   Owner:  carlos@example.com  / password123
 *   Tenant: ana@example.com     / password123
 *
 * Usage: pnpm db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Clean existing data ────────────────────────────────────────────────────
  // Delete in dependency order
  await db.vote.deleteMany();
  await db.ataApproval.deleteMany();
  await db.ata.deleteMany();
  await db.agendaItem.deleteMany();
  await db.meetingAttendee.deleteMany();
  await db.meeting.deleteMany();
  await db.announcementRead.deleteMany();
  await db.announcementAttachment.deleteMany();
  await db.announcement.deleteMany();
  await db.maintenanceUpdate.deleteMany();
  await db.maintenancePhoto.deleteMany();
  await db.maintenanceRequest.deleteMany();
  await db.transaction.deleteMany();
  await db.quota.deleteMany();
  await db.expense.deleteMany();
  await db.recurringExpense.deleteMany();
  await db.budgetItem.deleteMany();
  await db.budget.deleteMany();
  await db.contract.deleteMany();
  await db.document.deleteMany();
  await db.invite.deleteMany();
  await db.unit.deleteMany();
  await db.supplier.deleteMany();
  await db.membership.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.condominium.deleteMany();
  await db.user.deleteMany();

  console.log("  Cleaned existing data.");

  // ─── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await hash("password123", 12);

  const admin = await db.user.create({
    data: {
      name: "Administrador Aurora",
      email: "admin@aurora.pt",
      passwordHash,
      phone: "912345678",
      nif: "123456789",
    },
  });

  const joao = await db.user.create({
    data: {
      name: "João Silva",
      email: "joao@example.com",
      passwordHash,
      phone: "913456789",
    },
  });

  const maria = await db.user.create({
    data: {
      name: "Maria Santos",
      email: "maria@example.com",
      passwordHash,
      phone: "914567890",
    },
  });

  const carlos = await db.user.create({
    data: {
      name: "Carlos Ferreira",
      email: "carlos@example.com",
      passwordHash,
      phone: "915678901",
    },
  });

  const ana = await db.user.create({
    data: {
      name: "Ana Costa",
      email: "ana@example.com",
      passwordHash,
    },
  });

  console.log("  Created 5 users.");

  // ─── Condominium ────────────────────────────────────────────────────────────
  const condo = await db.condominium.create({
    data: {
      name: "Edifício Aurora",
      slug: "edificio-aurora",
      address: "Rua da Liberdade, 42",
      postalCode: "1250-142",
      city: "Lisboa",
      nif: "501234567",
      totalPermilagem: 1000,
      quotaModel: "PERMILAGEM",
      fiscalYearStart: 1,
    },
  });

  console.log("  Created condominium: Edifício Aurora.");

  // ─── Memberships ────────────────────────────────────────────────────────────
  await db.membership.createMany({
    data: [
      { userId: admin.id, condominiumId: condo.id, role: "ADMIN" },
      { userId: joao.id, condominiumId: condo.id, role: "OWNER" },
      { userId: maria.id, condominiumId: condo.id, role: "OWNER" },
      { userId: carlos.id, condominiumId: condo.id, role: "OWNER" },
      { userId: ana.id, condominiumId: condo.id, role: "TENANT" },
    ],
  });

  console.log("  Created 5 memberships (1 admin, 3 owners, 1 tenant).");

  // ─── Units (6 frações) ─────────────────────────────────────────────────────
  const unitData = [
    { identifier: "R/C Esq", floor: 0, typology: "T1", permilagem: 100, ownerId: admin.id },
    { identifier: "R/C Dto", floor: 0, typology: "T1", permilagem: 100, ownerId: joao.id, tenantId: ana.id },
    { identifier: "1.º Esq", floor: 1, typology: "T2", permilagem: 200, ownerId: joao.id },
    { identifier: "1.º Dto", floor: 1, typology: "T2", permilagem: 200, ownerId: maria.id },
    { identifier: "2.º Esq", floor: 2, typology: "T3", permilagem: 250, ownerId: carlos.id },
    { identifier: "2.º Dto", floor: 2, typology: "T2", permilagem: 150, ownerId: carlos.id },
  ];

  const units = [];
  for (const u of unitData) {
    const unit = await db.unit.create({
      data: { condominiumId: condo.id, ...u },
    });
    units.push(unit);
  }

  console.log("  Created 6 units (total permilagem: 1000).");

  // ─── Suppliers ──────────────────────────────────────────────────────────────
  const supplierLimpeza = await db.supplier.create({
    data: {
      condominiumId: condo.id,
      name: "LimpaTudo Lda.",
      nif: "509876543",
      phone: "210123456",
      email: "geral@limpatudo.pt",
      category: "Limpeza",
    },
  });

  const supplierElevador = await db.supplier.create({
    data: {
      condominiumId: condo.id,
      name: "ElevaPro S.A.",
      nif: "504321987",
      phone: "210654321",
      email: "contratos@elevapro.pt",
      category: "Elevadores",
    },
  });

  console.log("  Created 2 suppliers.");

  // ─── Budget (2026, approved) ────────────────────────────────────────────────
  const budget = await db.budget.create({
    data: {
      condominiumId: condo.id,
      year: 2026,
      status: "APPROVED",
      totalAmount: 24000,
      reserveFundPercentage: 10,
      approvedAt: new Date("2025-12-15"),
    },
  });

  const budgetItems = await Promise.all([
    db.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: "Limpeza",
        description: "Limpeza semanal das áreas comuns",
        plannedAmount: 7200,
      },
    }),
    db.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: "Elevador",
        description: "Manutenção mensal do elevador",
        plannedAmount: 4800,
      },
    }),
    db.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: "Electricidade",
        description: "Electricidade das áreas comuns",
        plannedAmount: 3600,
      },
    }),
    db.budgetItem.create({
      data: {
        budgetId: budget.id,
        category: "Fundo de Reserva",
        description: "10% do orçamento anual",
        plannedAmount: 2400,
      },
    }),
  ]);

  console.log("  Created 2026 budget (€24,000) with 4 items.");

  // ─── Quotas (Jan–Dec 2026) ─────────────────────────────────────────────────
  // Monthly quota total = 24000/12 = 2000€. Split by permilagem.
  const monthlyTotal = 2000;
  let quotaCount = 0;

  // Collect paid quota data so we can create Transaction records afterwards
  const paidQuotas: { id: string; amount: number; paymentDate: Date; unitIdentifier: string; period: string }[] = [];

  for (let month = 1; month <= 12; month++) {
    const period = `2026-${String(month).padStart(2, "0")}`;
    const dueDate = new Date(2026, month - 1, 8); // Due on the 8th

    for (const unit of units) {
      const amount = (unit.permilagem / 1000) * monthlyTotal;

      // Determine status based on month
      let status: "PAID" | "PENDING" | "OVERDUE";
      let paymentDate: Date | null = null;
      let paymentMethod: "TRANSFERENCIA" | "MBWAY" | "MULTIBANCO" | null = null;

      if (month <= 2) {
        // Jan-Feb: all paid
        status = "PAID";
        paymentDate = new Date(2026, month - 1, 5);
        paymentMethod = month % 2 === 0 ? "MBWAY" : "TRANSFERENCIA";
      } else if (month === 3) {
        // March: some paid, some pending
        if (unit.permilagem >= 200) {
          status = "PAID";
          paymentDate = new Date(2026, 2, 6);
          paymentMethod = "MULTIBANCO";
        } else {
          status = "PENDING";
        }
      } else {
        // Apr onwards: pending (future)
        status = "PENDING";
      }

      const quota = await db.quota.create({
        data: {
          condominiumId: condo.id,
          unitId: unit.id,
          period,
          amount,
          dueDate,
          status,
          paymentDate,
          paymentMethod,
        },
      });
      quotaCount++;

      if (status === "PAID" && paymentDate) {
        paidQuotas.push({ id: quota.id, amount, paymentDate, unitIdentifier: unit.identifier, period });
      }
    }
  }

  console.log(`  Created ${quotaCount} quotas (Jan–Dec 2026).`);

  // ─── Expenses ───────────────────────────────────────────────────────────────
  const expenses = [
    { date: new Date("2026-01-05"), description: "Limpeza - Janeiro", amount: 600, category: "Limpeza", supplierId: supplierLimpeza.id, budgetItemId: budgetItems[0].id },
    { date: new Date("2026-01-15"), description: "Manutenção elevador - Janeiro", amount: 400, category: "Elevador", supplierId: supplierElevador.id, budgetItemId: budgetItems[1].id },
    { date: new Date("2026-01-20"), description: "Electricidade - Janeiro", amount: 280, category: "Electricidade", budgetItemId: budgetItems[2].id },
    { date: new Date("2026-02-05"), description: "Limpeza - Fevereiro", amount: 600, category: "Limpeza", supplierId: supplierLimpeza.id, budgetItemId: budgetItems[0].id },
    { date: new Date("2026-02-15"), description: "Manutenção elevador - Fevereiro", amount: 400, category: "Elevador", supplierId: supplierElevador.id, budgetItemId: budgetItems[1].id },
    { date: new Date("2026-02-22"), description: "Electricidade - Fevereiro", amount: 310, category: "Electricidade", budgetItemId: budgetItems[2].id },
    { date: new Date("2026-03-05"), description: "Limpeza - Março", amount: 600, category: "Limpeza", supplierId: supplierLimpeza.id, budgetItemId: budgetItems[0].id },
    { date: new Date("2026-03-10"), description: "Reparação porta entrada", amount: 450, category: "Manutenção", notes: "Porta principal partida por vandalismo" },
  ];

  for (const e of expenses) {
    await db.expense.create({
      data: { condominiumId: condo.id, ...e },
    });
  }

  console.log(`  Created ${expenses.length} expenses.`);

  // ─── Transactions (Livro de Caixa) ──────────────────────────────────────────
  // Create ledger entries for all paid quotas
  for (const q of paidQuotas) {
    await db.transaction.create({
      data: {
        condominiumId: condo.id,
        date: q.paymentDate,
        amount: q.amount,
        type: "QUOTA_PAYMENT",
        description: `Quota ${q.period} — ${q.unitIdentifier}`,
        quotaId: q.id,
      },
    });
  }

  // Create ledger entries for all expenses (negative = money out)
  const createdExpenses = await db.expense.findMany({
    where: { condominiumId: condo.id },
    orderBy: { date: "asc" },
  });

  for (const e of createdExpenses) {
    await db.transaction.create({
      data: {
        condominiumId: condo.id,
        date: e.date,
        amount: -Number(e.amount),
        type: "EXPENSE",
        description: e.description,
        expenseId: e.id,
      },
    });
  }

  console.log(
    `  Created ${paidQuotas.length} quota payment transactions + ${createdExpenses.length} expense transactions.`
  );

  // ─── Recurring Expenses ─────────────────────────────────────────────────────
  await db.recurringExpense.create({
    data: {
      condominiumId: condo.id,
      description: "Limpeza semanal das áreas comuns",
      amount: 600,
      category: "Limpeza",
      frequency: "MENSAL",
      isActive: true,
      lastGenerated: "2026-03",
    },
  });

  await db.recurringExpense.create({
    data: {
      condominiumId: condo.id,
      description: "Manutenção preventiva do elevador",
      amount: 400,
      category: "Elevador",
      frequency: "MENSAL",
      isActive: true,
      lastGenerated: "2026-02",
    },
  });

  console.log("  Created 2 recurring expense templates.");

  // ─── Announcements ─────────────────────────────────────────────────────────
  await db.announcement.create({
    data: {
      condominiumId: condo.id,
      authorId: admin.id,
      title: "Obras na fachada — início previsto para Abril",
      body: "Informamos todos os condóminos que as obras de reabilitação da fachada terão início na primeira semana de Abril de 2026. Os trabalhos deverão durar aproximadamente 3 meses.\n\nDurante este período, poderá haver algum ruído entre as 9h e as 18h nos dias úteis. Pedimos a compreensão de todos.\n\nO orçamento aprovado em assembleia foi de €15.000, já contemplado no fundo de reserva.",
      category: "OBRAS",
      pinned: true,
      createdAt: new Date("2026-03-10"),
    },
  });

  await db.announcement.create({
    data: {
      condominiumId: condo.id,
      authorId: admin.id,
      title: "Próxima assembleia geral ordinária",
      body: "A assembleia geral ordinária do Edifício Aurora realizar-se-á no dia 15 de Abril de 2026, às 19h00, na sala de condomínio do R/C.\n\nOrdem de trabalhos:\n1. Aprovação da ata anterior\n2. Apresentação e aprovação das contas de 2025\n3. Orçamento para 2026 (já aprovado por maioria)\n4. Obras na fachada — ponto de situação\n5. Diversos",
      category: "ASSEMBLEIA",
      pinned: false,
      createdAt: new Date("2026-03-15"),
    },
  });

  await db.announcement.create({
    data: {
      condominiumId: condo.id,
      authorId: admin.id,
      title: "Manutenção do elevador — 20 de Março",
      body: "O elevador estará fora de serviço no dia 20 de Março entre as 10h e as 14h para manutenção preventiva semestral.\n\nPedimos desculpa pelo incómodo.",
      category: "MANUTENCAO",
      pinned: false,
      createdAt: new Date("2026-03-17"),
    },
  });

  console.log("  Created 3 announcements.");

  // ─── Maintenance Requests ──────────────────────────────────────────────────
  const maint1 = await db.maintenanceRequest.create({
    data: {
      condominiumId: condo.id,
      requesterId: joao.id,
      title: "Lâmpada fundida no 1.º andar",
      description: "A lâmpada do corredor do 1.º andar fundiu. Não há iluminação à noite.",
      location: "Corredor do 1.º andar",
      priority: "MEDIA",
      status: "CONCLUIDO",
      createdAt: new Date("2026-02-10"),
    },
  });

  await db.maintenanceUpdate.create({
    data: {
      maintenanceRequestId: maint1.id,
      status: "EM_ANALISE",
      note: "Pedido recebido, vamos verificar.",
      createdAt: new Date("2026-02-11"),
    },
  });

  await db.maintenanceUpdate.create({
    data: {
      maintenanceRequestId: maint1.id,
      status: "CONCLUIDO",
      note: "Lâmpada substituída por LED.",
      createdAt: new Date("2026-02-13"),
    },
  });

  await db.maintenanceRequest.create({
    data: {
      condominiumId: condo.id,
      requesterId: maria.id,
      title: "Infiltração na garagem",
      description: "Há uma infiltração de água no tecto da garagem, perto do lugar 4. Apareceu após as chuvas da semana passada.",
      location: "Garagem — lugar 4",
      priority: "ALTA",
      status: "EM_CURSO",
      supplierId: supplierLimpeza.id,
      createdAt: new Date("2026-03-05"),
    },
  });

  console.log("  Created 2 maintenance requests (1 completed, 1 in progress).");

  // ─── Meetings ──────────────────────────────────────────────────────────────
  // Past meeting (completed)
  const pastMeeting = await db.meeting.create({
    data: {
      condominiumId: condo.id,
      date: new Date("2025-12-15T19:00:00"),
      location: "Sala de condomínio, R/C",
      type: "ORDINARIA",
      status: "REALIZADA",
    },
  });

  // Agenda items for past meeting
  const agendaItem1 = await db.agendaItem.create({
    data: {
      meetingId: pastMeeting.id,
      order: 1,
      title: "Aprovação das contas de 2024",
      description: "Apresentação e votação do relatório de contas do exercício de 2024.",
    },
  });

  const agendaItem2 = await db.agendaItem.create({
    data: {
      meetingId: pastMeeting.id,
      order: 2,
      title: "Orçamento para 2026",
      description: "Discussão e votação do orçamento anual de €24.000 para 2026.",
    },
  });

  await db.agendaItem.create({
    data: {
      meetingId: pastMeeting.id,
      order: 3,
      title: "Diversos",
    },
  });

  // Attendance
  const ownerUserIds = [
    { userId: admin.id, status: "PRESENTE" as const, permilagem: 100 },
    { userId: joao.id, status: "PRESENTE" as const, permilagem: 300 },
    { userId: maria.id, status: "REPRESENTADO" as const, permilagem: 200 },
    { userId: carlos.id, status: "PRESENTE" as const, permilagem: 400 },
  ];

  for (const att of ownerUserIds) {
    await db.meetingAttendee.create({
      data: {
        meetingId: pastMeeting.id,
        userId: att.userId,
        status: att.status,
        permilagem: att.permilagem,
        representedBy: att.status === "REPRESENTADO" ? admin.id : null,
      },
    });
  }

  // Votes on agenda items
  for (const unit of units) {
    await db.vote.create({
      data: {
        meetingId: pastMeeting.id,
        agendaItemId: agendaItem1.id,
        unitId: unit.id,
        vote: "A_FAVOR",
        permilagem: unit.permilagem,
      },
    });
  }

  // Budget vote: 5 in favour, 1 against
  for (const unit of units) {
    await db.vote.create({
      data: {
        meetingId: pastMeeting.id,
        agendaItemId: agendaItem2.id,
        unitId: unit.id,
        vote: unit.identifier === "2.º Dto" ? "CONTRA" : "A_FAVOR",
        permilagem: unit.permilagem,
      },
    });
  }

  // Ata for past meeting
  await db.ata.create({
    data: {
      meetingId: pastMeeting.id,
      number: 1,
      content:
        "Ata n.º 1/2025 — Assembleia Geral Ordinária\n\n" +
        "Data: 15 de Dezembro de 2025, 19h00\n" +
        "Local: Sala de condomínio, R/C\n\n" +
        "Presenças: Administrador Aurora, João Silva, Carlos Ferreira (presentes); Maria Santos (representada pelo Administrador).\n\n" +
        "Ponto 1 — Aprovação das contas de 2024: Aprovado por unanimidade.\n\n" +
        "Ponto 2 — Orçamento para 2026: Aprovado por maioria (850/1000 permilagem a favor). O condómino Carlos Ferreira (fração 2.º Dto, 150‰) votou contra, argumentando que o valor da manutenção do elevador é excessivo.\n\n" +
        "Ponto 3 — Diversos: Discutiu-se a necessidade de obras na fachada. O administrador ficou de obter orçamentos.\n\n" +
        "A reunião terminou às 20h15.",
      status: "FINAL",
    },
  });

  // Future meeting (scheduled)
  const futureMeeting = await db.meeting.create({
    data: {
      condominiumId: condo.id,
      date: new Date("2026-04-15T19:00:00"),
      location: "Sala de condomínio, R/C",
      type: "ORDINARIA",
      status: "AGENDADA",
    },
  });

  await db.agendaItem.createMany({
    data: [
      { meetingId: futureMeeting.id, order: 1, title: "Aprovação da ata anterior" },
      { meetingId: futureMeeting.id, order: 2, title: "Apresentação das contas de 2025" },
      { meetingId: futureMeeting.id, order: 3, title: "Obras na fachada — ponto de situação" },
      { meetingId: futureMeeting.id, order: 4, title: "Diversos" },
    ],
  });

  console.log("  Created 2 meetings (1 completed with votes/ata, 1 scheduled).");

  // ─── Contracts ──────────────────────────────────────────────────────────────
  await db.contract.create({
    data: {
      condominiumId: condo.id,
      supplierId: supplierLimpeza.id,
      description: "Contrato de limpeza semanal das áreas comuns",
      type: "Limpeza",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      renewalType: "AUTOMATICA",
      annualCost: 7200,
      paymentFrequency: "MENSAL",
      status: "ATIVO",
    },
  });

  await db.contract.create({
    data: {
      condominiumId: condo.id,
      supplierId: supplierElevador.id,
      description: "Seguro multirriscos do edifício",
      type: "Seguro",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-12-31"),
      renewalType: "MANUAL",
      annualCost: 1800,
      paymentFrequency: "ANUAL",
      status: "EXPIRADO",
      policyNumber: "APL-2025-78432",
      insuredValue: 500000,
      coverageType: "Multirriscos",
      notes: "Precisa de renovação — contactar seguradora.",
    },
  });

  console.log("  Created 2 contracts (1 active, 1 expired).");

  // ─── Documents ──────────────────────────────────────────────────────────────
  await db.document.create({
    data: {
      condominiumId: condo.id,
      name: "Regulamento do Condomínio",
      category: "REGULAMENTOS",
      fileUrl: "/uploads/regulamento-aurora.pdf",
      fileName: "regulamento-aurora.pdf",
      fileSize: 245000,
      visibility: "ALL",
    },
  });

  await db.document.create({
    data: {
      condominiumId: condo.id,
      name: "Orçamento 2026 — Detalhado",
      category: "ORCAMENTOS",
      fileUrl: "/uploads/orcamento-2026.pdf",
      fileName: "orcamento-2026.pdf",
      fileSize: 128000,
      visibility: "ADMIN_ONLY",
    },
  });

  console.log("  Created 2 documents.");

  // ─── Invite ─────────────────────────────────────────────────────────────────
  await db.invite.create({
    data: {
      condominiumId: condo.id,
      email: "novo.condominino@example.com",
      role: "OWNER",
      expiresAt: new Date("2026-04-30"),
    },
  });

  console.log("  Created 1 pending invite.");

  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Admin:  admin@aurora.pt     / password123");
  console.log("  Owner:  joao@example.com    / password123");
  console.log("  Owner:  maria@example.com   / password123");
  console.log("  Owner:  carlos@example.com  / password123");
  console.log("  Tenant: ana@example.com     / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
