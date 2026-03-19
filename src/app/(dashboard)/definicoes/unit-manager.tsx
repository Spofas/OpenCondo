"use client";

import { useState } from "react";
import { Upload, Home, Plus, ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import {
  importUnitsFromCsv,
  assignUnitMember,
  updateUnitPermilagem,
  createUnit,
  moveUnit,
  deleteUnit,
} from "../actions";

interface UnitInfo {
  id: string;
  identifier: string;
  floor: string | null;
  typology: string | null;
  permilagem: number;
  ownerName: string | null;
  ownerId: string | null;
  tenantName: string | null;
  tenantId: string | null;
}

interface MemberInfo {
  userId: string;
  userName: string;
  userEmail: string;
}

const EMPTY_FORM = { identifier: "", floor: "", typology: "", permilagem: "" };

export function UnitManager({
  condominiumId,
  units,
  members,
}: {
  condominiumId: string;
  units: UnitInfo[];
  members: MemberInfo[];
}) {
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Track permilagem errors per unit
  const [permilagemErrors, setPermilagemErrors] = useState<Record<string, string>>({});

  function showMsg(type: "error" | "success", msg: string) {
    if (type === "error") { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  }

  async function handleImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    const result = await importUnitsFromCsv(condominiumId, csvText);
    setImporting(false);
    if (result.error) { showMsg("error", result.error); }
    else {
      showMsg("success", result.message || "Importação concluída");
      setCsvText(""); setShowImport(false);
    }
  }

  async function handleCreate() {
    const perm = parseInt(createForm.permilagem, 10);
    if (!createForm.identifier.trim()) { showMsg("error", "Identificação é obrigatória"); return; }
    if (isNaN(perm) || perm < 0 || perm > 1000) { showMsg("error", "Permilagem deve estar entre 0 e 1000"); return; }
    setCreating(true);
    const result = await createUnit(condominiumId, {
      identifier: createForm.identifier,
      floor: createForm.floor || undefined,
      typology: createForm.typology || undefined,
      permilagem: perm,
    });
    setCreating(false);
    if (result.error) { showMsg("error", result.error); }
    else { showMsg("success", "Fração criada"); setCreateForm(EMPTY_FORM); setShowCreate(false); }
  }

  async function handleAssign(unitId: string, userId: string | null, role: "owner" | "tenant") {
    const result = await assignUnitMember(unitId, userId, role);
    if (result.error) showMsg("error", result.error);
  }

  async function handlePermilagemChange(unitId: string, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 1000) {
      setPermilagemErrors((e) => ({ ...e, [unitId]: "0–1000" }));
      return;
    }
    setPermilagemErrors((e) => { const n = { ...e }; delete n[unitId]; return n; });
    const result = await updateUnitPermilagem(unitId, num);
    if (result?.error) showMsg("error", result.error);
  }

  async function handleMove(unitId: string, direction: "up" | "down") {
    const result = await moveUnit(unitId, direction);
    if (result.error) showMsg("error", result.error);
  }

  async function handleDelete(unitId: string) {
    const result = await deleteUnit(unitId);
    if (result.error) { showMsg("error", result.error); setDeleteConfirmId(null); }
    else { setDeleteConfirmId(null); }
  }

  const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          Frações ({units.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreate(!showCreate); setShowImport(false); }}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Nova fração
          </button>
          <button
            onClick={() => { setShowImport(!showImport); setShowCreate(false); }}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Upload size={14} />
            Importar CSV
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Nova fração</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Identificação *</label>
              <input
                value={createForm.identifier}
                onChange={(e) => setCreateForm((f) => ({ ...f, identifier: e.target.value }))}
                placeholder="ex: R/C Esq"
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Piso</label>
              <input
                value={createForm.floor}
                onChange={(e) => setCreateForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="ex: R/C"
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Tipologia</label>
              <input
                value={createForm.typology}
                onChange={(e) => setCreateForm((f) => ({ ...f, typology: e.target.value }))}
                placeholder="ex: T2"
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Permilagem (0–1000)</label>
              <input
                type="number"
                value={createForm.permilagem}
                onChange={(e) => setCreateForm((f) => ({ ...f, permilagem: e.target.value }))}
                min={0}
                max={1000}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "A criar..." : "Criar fração"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); }}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* CSV Import */}
      {showImport && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">Importar frações via CSV</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Formato: identificador;piso;tipologia;permilagem;email
            <br />
            Exemplo: R/C Esq;R/C;T2;150;joao@email.pt
          </p>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"R/C Esq;R/C;T2;150;joao@email.pt\n1.º Dto;1;T3;180;"}
            className="mb-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing || !csvText.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {importing ? "A importar..." : "Importar"}
            </button>
            <button
              onClick={() => { setShowImport(false); setCsvText(""); }}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Permilagem summary */}
      <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
        <span className="font-medium">Permilagem total: </span>
        <span className={totalPermilagem === 1000 ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
          {totalPermilagem}‰
        </span>
        {totalPermilagem !== 1000 && (
          <span className="ml-1 text-xs text-muted-foreground">(deve somar 1000‰)</span>
        )}
      </div>

      {/* Units table */}
      {units.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Home size={24} strokeWidth={1.5} />
          <p className="text-sm">Nenhuma fração registada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="w-8 pb-2" />
                <th className="pb-2 font-medium">Fração</th>
                <th className="pb-2 font-medium">Piso</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Permil.</th>
                <th className="pb-2 font-medium">Proprietário</th>
                <th className="pb-2 font-medium">Inquilino</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {units.map((unit, idx) => (
                <tr key={unit.id} className="border-b border-border/50">
                  {/* Reorder arrows */}
                  <td className="py-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMove(unit.id, "up")}
                        disabled={idx === 0}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-20"
                        title="Mover para cima"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMove(unit.id, "down")}
                        disabled={idx === units.length - 1}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-20"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 font-medium text-foreground">{unit.identifier}</td>
                  <td className="py-2.5 text-muted-foreground">{unit.floor || "—"}</td>
                  <td className="py-2.5 text-muted-foreground">{unit.typology || "—"}</td>
                  <td className="py-2.5">
                    <div>
                      <input
                        type="number"
                        defaultValue={unit.permilagem}
                        key={unit.permilagem} // reset when server data changes
                        onBlur={(e) => handlePermilagemChange(unit.id, e.target.value)}
                        className={`w-16 rounded border px-2 py-1 text-xs text-foreground outline-none focus:border-primary ${
                          permilagemErrors[unit.id]
                            ? "border-destructive bg-destructive/5"
                            : "border-input bg-background"
                        }`}
                        min={0}
                        max={1000}
                      />
                      {permilagemErrors[unit.id] && (
                        <p className="mt-0.5 text-[10px] text-destructive">{permilagemErrors[unit.id]}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5">
                    <select
                      value={unit.ownerId || ""}
                      onChange={(e) => handleAssign(unit.id, e.target.value || null, "owner")}
                      className="w-full max-w-[160px] rounded border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="">— Sem proprietário —</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.userName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5">
                    <select
                      value={unit.tenantId || ""}
                      onChange={(e) => handleAssign(unit.id, e.target.value || null, "tenant")}
                      className="w-full max-w-[160px] rounded border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="">— Sem inquilino —</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.userName}</option>
                      ))}
                    </select>
                  </td>
                  {/* Delete */}
                  <td className="py-2.5">
                    {deleteConfirmId === unit.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="rounded bg-destructive px-2 py-1 text-[10px] font-medium text-white hover:bg-destructive/90 transition-colors"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(unit.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Eliminar fração"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
