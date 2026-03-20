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

### Receipt test
- [ ] On a paid quota, click the receipt button (recibo) — a PDF opens or downloads
- [ ] The PDF shows the unit identifier, amount, payment date, and condo name

---

## 4. Finances — Devedores (Debt Tracker)

- [ ] Go to Finanças → Devedores
- [ ] The unpaid quotas appear here, grouped by unit or owner
- [ ] The unit that paid in the previous section does NOT appear here
- [ ] Total outstanding debt shown matches the sum of unpaid quota amounts

---

## 5. Finances — Expenses (Despesas)

- [ ] Go to Finanças → Despesas
- [ ] Create a new expense: Limpeza, 100€, today's date, description "Limpeza mensal"
- [ ] It appears in the list with the correct category and amount
- [ ] Create another expense in a different category (e.g. Seguro, 800€)
- [ ] Both expenses appear in the list
- [ ] Delete one expense — a confirmation step appears ("Tem a certeza?")
- [ ] Confirm — it disappears from the list
- [ ] Cancel on the confirmation — nothing is deleted

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

---

## Notes

Use this section to record anything unexpected during testing:

| # | Section | What happened | Status |
|---|---------|---------------|--------|
|   |         |               |        |
|   |         |               |        |
|   |         |               |        |

---

*Last updated: 2026-03-20*
