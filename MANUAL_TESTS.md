# OpenCondo — Manual Test Checklist

**Setup assumed:**
- Admin account created ✅
- Condominium created ✅
- 3 floors (R/C, 1.º, 2.º), 6 units (2 per floor) ✅
- Fresh database ✅

Use this file to track manual test sessions. Mark each item ✅ pass, ❌ fail, or ⚠️ partial.
Write notes next to anything that fails so it can be fixed later.

---

## 1. Settings & Setup (Definições)

### 1.1 Units

- [ ] Units are listed in the correct order: R/C Esq, R/C Dto, 1.º Esq, 1.º Dto, 2.º Esq, 2.º Dto
- [ ] Each unit shows its floor correctly (R/C for floor 0, 1.º for floor 1, 2.º for floor 2)
- [ ] You can edit a unit's identifier (e.g. rename "R/C Esq" to "R/C Esquerdo") — it saves on blur (click away)
- [ ] You can edit a unit's permilagem — it saves on blur
- [ ] Total permilagem shown at the top updates when you change a unit's value
- [ ] A warning appears if total permilagem is not 1000‰

### 1.2 Inviting Members

- [ ] Click "Convidar membro" — the invite form appears
- [ ] Fill in an email and role (Proprietário), select a unit — invite sends
- [ ] Try inviting with an empty email — an error appears, no invite sent
- [ ] Try inviting the same email twice — an error appears

### 1.3 CSV Import

- [ ] Click "Importar CSV" — the import panel appears
- [ ] Paste this test CSV and import it — it should fail gracefully (units already exist, duplicates rejected):
  ```
  R/C Esq;0;T2;170;
  R/C Dto;0;T2;160;
  ```
- [ ] Paste a CSV with duplicate identifiers in the file itself and verify the error message names both line numbers:
  ```
  Novo1;0;T1;100;
  Novo2;1;T2;150;
  Novo1;2;T3;200;
  ```
  Expected: error on line 3 saying identifier 'Novo1' is a duplicate of line 1
- [ ] Cancel closes the panel without doing anything

### 1.4 Condo Info

- [ ] The condo name, address, and NIF shown on the info card match what you entered at setup
- [ ] (If editable) Changing the condo name saves correctly

---

## 2. Finances — Budget (Orçamento)

- [ ] Go to Finanças → Orçamento
- [ ] Create a new budget for the current year (2026) — the form accepts it
- [ ] Add at least 3 expense categories with amounts (e.g. Limpeza: 1200€, Elevador: 600€, Seguro: 800€)
- [ ] The total is shown correctly as the sum of all line items
- [ ] Reserve fund percentage is shown (minimum 10%)
- [ ] Save the budget — it appears in the list
- [ ] Try creating a second budget for the same year — it should be rejected (only one budget per year)
- [ ] Approve the budget — its status changes to "Aprovado"

---

## 3. Finances — Quotas

- [ ] Go to Finanças → Quotas
- [ ] Generate quotas for a period (e.g. Janeiro 2026, monthly, based on the budget)
- [ ] 6 quota lines appear — one per unit
- [ ] Units are ordered by floor: R/C first, then 1.º, then 2.º
- [ ] Each unit's quota amount is proportional to its permilagem (units with more permilagem pay more)
- [ ] All quotas start with status "Pendente"
- [ ] Click "Registar pagamento" on one quota — a payment form appears
- [ ] Fill in payment date and method — save it
- [ ] That quota's status changes to "Pago" ✅
- [ ] The other 5 remain "Pendente"
- [ ] Generate quotas for a second month (Fevereiro 2026) — 6 more lines appear
- [ ] Try generating the same month twice — it should be rejected

### Year filter test
- [ ] Generate quotas for a different year (e.g. 2025 if you have seed data, or check URL `?year=2025`)
- [ ] Only quotas for the selected year are shown
- [ ] The year selector dropdown contains only years with quota data

### Receipt test
- [ ] On a paid quota, click the receipt button (recibo) — a PDF opens or downloads
- [ ] The PDF shows the unit identifier, amount, payment date, and condo name

### Receipt ownership test (non-admin)
- [ ] Log in as a Proprietário who owns unit R/C Esq
- [ ] Navigate to `/api/receipts/<quotaId>` for a quota belonging to a **different** unit — the server returns a 403 error, not the PDF
- [ ] Navigate to `/api/receipts/<quotaId>` for a quota belonging to **their** unit — the PDF downloads correctly

---

## 4. Finances — Devedores (Debt Tracker)

- [ ] Navigate to Finanças → Devedores — you are **redirected** to Finanças → Quotas (devedores is no longer a standalone page)
- [ ] Debtor/overdue information is visible within the quotas page

---

## 5. Finances — Expenses (Despesas)

### Expense page access control (non-admin)
- [ ] Log in as a Proprietário — navigate to `/c/{slug}/financas/despesas` — you are **redirected** to `/c/{slug}/painel` (expenses are admin-only)

### Expense CRUD (admin)
- [ ] Go to Finanças → Despesas
- [ ] Create a new expense: Limpeza, 100€, today's date, description "Limpeza mensal"
- [ ] It appears in the list with the correct category and amount
- [ ] Create another expense in a different category (e.g. Seguro, 800€)
- [ ] Both expenses appear in the list
- [ ] Delete one expense — a confirmation step appears ("Tem a certeza?")
- [ ] Confirm — it disappears from the list
- [ ] Cancel on the confirmation — nothing is deleted
- [ ] Check Livro de Caixa — the deleted expense's transaction entry no longer appears (soft-deleted together)

### Recurring expenses
- [ ] Go to Finanças → Despesas Recorrentes
- [ ] Create a recurring expense: Limpeza, 100€/month
- [ ] It appears in the recurring list

---

## 6. Finances — Conta de Gerência

- [ ] Go to Finanças → Conta de Gerência
- [ ] The report shows income (from paid quotas) and expenses (from recorded expenses)
- [ ] The balance (income minus expenses) is calculated correctly
- [ ] Download or view the PDF — it opens without errors

---

## 7. Communication — Announcements (Avisos)

- [ ] Go to Comunicação → Avisos
- [ ] Create a new announcement: title "Reunião de condomínio", category "Assembleia", body text
- [ ] It appears in the list, pinned at the top if you chose to pin it
- [ ] Create a second announcement with category "Urgente"
- [ ] Both appear in the correct order (pinned first)
- [ ] Edit an announcement — the changes save correctly
- [ ] Delete an announcement — confirmation step appears, then it's removed

---

## 8. Communication — Maintenance Requests (Manutenção)

- [ ] Go to Comunicação → Manutenção
- [ ] Create a new request: "Lâmpada fundida nas escadas", location "Área comum", priority "Baixa"
- [ ] It appears with status "Submetido"
- [ ] Click into it and change the status to "Em curso" — it updates
- [ ] Add an admin note — it saves
- [ ] Change status to "Concluído" — it updates and shows as resolved
- [ ] Create a second request and leave it open — both appear in the list

---

## 9. Communication — Documents (Documentos)

- [ ] Go to Comunicação → Documentos
- [ ] Upload a PDF (any PDF from your computer) with category "Regulamentos"
- [ ] It appears in the document list
- [ ] Upload a second document with a different category
- [ ] Filter or browse by category — the correct document appears
- [ ] Delete a document — confirmation step, then it's removed

---

## 10. Meetings — Schedule (Reuniões)

- [ ] Go to Assembleia → Reuniões
- [ ] Schedule a new meeting: type "Ordinária", date in the future, time, location "Sala de condomínio"
- [ ] Add 3 agenda items (e.g. "Aprovação do orçamento", "Quotas 2026", "Outros assuntos")
- [ ] The meeting appears in the list with status "Agendada"
- [ ] Open the meeting and record attendance:
  - Mark 2 units as "Presente"
  - Mark 1 unit as "Representado"
  - Leave 3 as "Ausente"
- [ ] Quorum percentage is shown and calculated based on present + represented permilagem
- [ ] Record votes on an agenda item (a favor / contra / abstenção)
- [ ] Mark the meeting as "Concluída"

---

## 11. Meetings — Atas

- [ ] Go to Assembleia → Atas
- [ ] The completed meeting appears here (or create a new ata manually)
- [ ] Open the ata — the text editor appears
- [ ] Type some content into the ata
- [ ] Save as draft — status shows "Rascunho"
- [ ] Finalise the ata — status changes to "Final"
- [ ] Download/view the PDF — it opens correctly

---

## 12. Contracts (Contratos)

- [ ] Go to Contratos
- [ ] Add a new contract: "Limpeza semanal", supplier "Limpeza Lda", start date Jan 2026, end date Dec 2026, annual cost 1200€, auto-renewal
- [ ] It appears in the list with status "Ativo"
- [ ] Add a second contract that has already expired (end date in the past)
- [ ] It appears with status "Expirado" and is visually distinct
- [ ] Edit the first contract — changes save correctly
- [ ] Delete a contract — confirmation step, then removed

---

## 13. Calendar (Calendário)

- [ ] Go to Calendário
- [ ] The meeting you scheduled in section 10 appears on the correct date
- [ ] Quota due dates appear (if quotas have due dates set)
- [ ] Contracts with upcoming renewal/expiry dates appear
- [ ] Navigate to a different month — the view updates

---

## 14. My Account (Minha Conta)

- [ ] Go to Minha Conta
- [ ] Your name and email are shown correctly
- [ ] Change your name — it saves
- [ ] Change your password: enter current password, new password, confirm
- [ ] Log out and log back in with the new password — it works

---

## 15. Role-Based Access

To test this properly you need a second user. Use the invite flow from section 1.2 to invite a test email as **Proprietário**, register that account, and log in with it.

### As a Proprietário (Owner):
- [ ] Can view the dashboard (Painel)
- [ ] Can view Finanças sections (read-only — no "Gerar quotas", no "Registar pagamento" buttons)
- [ ] Can view Avisos
- [ ] Can submit a Manutenção request
- [ ] Can view Documentos (those not marked admin-only)
- [ ] Can view Reuniões and Atas
- [ ] **Cannot** see any "Criar", "Editar", or "Eliminar" buttons in financial sections
- [ ] **Cannot** access Definições to manage units or members

### As an Inquilino (Tenant):
- Repeat the invite flow with role "Inquilino"
- [ ] Can view Avisos
- [ ] Can submit a Manutenção request
- [ ] Has more limited access than Proprietário

---

## 16. Edge Cases

- [ ] **Zero permilagem:** Set one unit's permilagem to 0 and generate quotas — that unit gets a 0€ quota (no crash)
- [ ] **Large amounts:** Create an expense for 99,999€ — it saves and displays correctly
- [ ] **Long text:** Enter a very long announcement body (500+ characters) — it saves and displays without breaking the layout
- [ ] **Special characters:** Use special characters in a unit name (e.g. "R/C Esq.") — no issues
- [ ] **Empty states:** On a fresh condo with no quotas yet, the Quotas page shows a helpful empty state (not a blank page or error)
- [ ] **Back button:** Navigate around the app using the browser's back button — no broken pages

---

## 17. Auth & Security

- [ ] Log out — you're redirected to the login page
- [ ] Try accessing `/painel` directly while logged out — you're redirected to login
- [ ] Try accessing `/definicoes` while logged in as a Proprietário — you're redirected or see an error
- [ ] Forgot password flow: on the login page, click "Esqueceu a password?", enter your email, check for the reset email, follow the link, set a new password, log in ✅

### 17.1 Email Verification

- [ ] Register a new account — after login, you should be redirected to `/verificar-email` (not dashboard)
- [ ] The verification pending page shows a "Reenviar email de verificação" button
- [ ] Click the resend button — in dev mode, check console for the verification token; in production, check email
- [ ] Try accessing `/painel` or `/onboarding` with an unverified account — you're redirected to `/verificar-email`
- [ ] Visit `/verificar-email/<token>` with the correct token — shows "Email verificado" success message
- [ ] After verification, accessing `/painel` works normally (no more redirect)
- [ ] Visit `/verificar-email/<invalid-token>` — shows "Link inválido ou expirado" error message

---

## 18. Finances — Livro de Caixa (Cash Ledger)

- [ ] Go to Finanças → Livro de Caixa
- [ ] Using the seed data (or after recording payments and expenses), confirm the ledger is not empty
- [ ] Each paid quota from section 3 appears as a positive entry (type: Quota)
- [ ] Each expense from section 5 appears as a negative entry (type: Despesa)
- [ ] The running balance at the bottom of the list equals the sum of all entries
- [ ] Delete an expense from Finanças → Despesas — go back to Livro de Caixa and confirm that entry is also gone (soft-delete cascaded to the Transaction)
- [ ] Use "Anular pagamento" on a paid quota — go back to Livro de Caixa and confirm the quota payment entry is also gone

---

## 19. Dashboard (Painel) — Stat Cards

### As Admin:
- [ ] Go to Painel
- [ ] Four stat cards are visible: Saldo, Receitas, Despesas, Próxima Assembleia
- [ ] **Saldo (YTD):** equals Receitas minus Despesas for the current calendar year
- [ ] **Receitas (YTD):** matches the sum of paid quota Transaction amounts for the current year in Livro de Caixa
- [ ] **Despesas (YTD):** matches the sum of expense Transaction amounts (absolute value) for the current year in Livro de Caixa
- [ ] **Próxima Assembleia:** shows the date of the next scheduled meeting, or "Nenhuma agendada" if none
- [ ] If there are overdue quotas, the attention section below the stat cards lists them
- [ ] The attention section does **not** duplicate the stat card information (no redundant "Em atraso" count card)

### As Proprietário (Owner):
- [ ] Log in as a proprietário
- [ ] Two stat cards are visible: Próxima Quota and Próxima Assembleia
- [ ] **Próxima Quota:** shows the amount and due date of their next unpaid quota (or "Em dia" if none pending)
- [ ] **Próxima Assembleia:** shows the next scheduled meeting date

---

## 20. Finances — Soft Delete Cascade Checks

These verify that deleting financial records cleans up their linked ledger entries.

- [ ] Record a payment for a quota (section 3) — verify it appears in Livro de Caixa
- [ ] Click "Anular pagamento" on that quota — verify the Transaction entry disappears from Livro de Caixa and the quota returns to "Pendente" / "Em atraso"
- [ ] Create an expense and verify it appears in Livro de Caixa as a negative entry
- [ ] Delete that expense — verify its Transaction entry also disappears from Livro de Caixa
- [ ] Verify the deleted expense does **not** reappear after a page refresh (soft delete is persisted)

---

## 21. Cron Job — Nightly Processing

This test requires access to the deployment environment (Vercel) or a local server with `CRON_SECRET` set.

- [ ] In Vercel → Settings → Environment Variables, confirm `CRON_SECRET` is set
- [ ] Trigger the cron endpoint manually:
  ```
  curl -X POST https://your-app.vercel.app/api/cron/process \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```
- [ ] The response returns `{ "ok": true }` (not a 401 or 500)
- [ ] Call without the `Authorization` header — the response returns a 401
- [ ] After triggering with valid secret: any PENDING quotas past their due date now show as "Em atraso" (OVERDUE)
- [ ] Any active recurring expense templates whose `lastGenerated` is before the current period now have a new expense generated — visible in Finanças → Despesas and Livro de Caixa

---

## 22. Auth Routing (Proxy)

- [ ] Visit `/login` while authenticated → should redirect to `/painel`
- [ ] Visit `/registar` while authenticated → should redirect to `/painel`
- [ ] Visit `/` while authenticated → should redirect to `/painel`
- [ ] Visit `/painel` while unauthenticated → should redirect to `/login`
- [ ] Log out, then refresh `/login` → should stay on `/login` (not redirect to `/painel`)
- [ ] Log in with valid credentials → should navigate to `/painel` automatically

---

## 23. Mobile Navigation

- [ ] Bottom navigation bar visible on mobile, hidden on desktop
- [ ] Admin sees category-based tabs (Finanças, Comunicação, Assembleias, Gestão)
- [ ] Owner/Tenant sees direct-link tabs (Dashboard, Quotas, Avisos, Reuniões, Minha Conta)
- [ ] Tapping a category tab opens a sheet with section links
- [ ] Mobile header shows condominium name
- [ ] Logout button visible on Minha Conta page (mobile only)

---

## Notes

Use this section to record anything unexpected during testing:

| # | Section | What happened | Status |
|---|---------|---------------|--------|
|   |         |               |        |
|   |         |               |        |
|   |         |               |        |

---

*Last updated: 2026-03-30*
