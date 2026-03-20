"use client";

import { useState } from "react";
import { Upload, Home, X } from "lucide-react";
import {
  importUnitsFromCsv,
  assignUnitMember,
  updateUnitPermilagem,
  updateUnitIdentifier,
} from "../actions";

interface UnitInfo {
  id: string;
  identifier: string;
  floor: number | null;
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
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [permilagemErrors, setPermilagemErrors] = useState<Record<string, string>>({});
  const [identifierErrors, setIdentifierErrors] = useState<Record<string, string>>({});

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

  async function handleIdentifierChange(unitId: string, value: string) {
    if (!value.trim()) {
      setIdentifierErrors((e) => ({ ...e, [unitId]: "Obrigatório" }));
      return;
    }
    setIdentifierErrors((e) => { const n = { ...e }; delete n[unitId]; return n; });
    const result = await updateUnitIdentifier(unitId, value);
    if (result?.error) {
      setIdentifierErrors((e) => ({ ...e, [unitId]: result.error! }));
    }
  }

  const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          {units.length === 1 ? "1 Fração" : `${units.length} Frações`}
        </h2>
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Upload size={14} />
          Importar CSV
        </button>
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

      {/* CSV Import */}
      {showImport && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">Importar frações via CSV</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Formato: identificador;piso;tipologia;permilagem;email
            <br />
            Exemplo: R/C Esq;0;T2;150;joao@email.pt
          </p>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"R/C Esq;0;T2;150;joao@email.pt\n1.º Dto;1;T3;180;"}
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
          <p className="text-sm">Nenhuma fração registada. Use "Importar CSV" para adicionar frações.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Identificação</th>
                <th className="pb-2 font-medium">Piso</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Permil.</th>
                <th className="pb-2 font-medium">Proprietário</th>
                <th className="pb-2 font-medium">Inquilino</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-border/50">
                  <td className="py-2.5">
                    <div>
                      <input
                        type="text"
                        defaultValue={unit.identifier}
                        key={unit.identifier}
                        onBlur={(e) => {
                          if (e.target.value !== unit.identifier) {
                            handleIdentifierChange(unit.id, e.target.value);
                          }
                        }}
                        className={`w-full max-w-[140px] rounded border px-2 py-1 text-sm font-medium text-foreground outline-none focus:border-primary ${
                          identifierErrors[unit.id]
                            ? "border-destructive bg-destructive/5"
                            : "border-transparent bg-transparent hover:border-input focus:bg-background"
                        }`}
                      />
                      {identifierErrors[unit.id] && (
                        <p className="mt-0.5 text-[10px] text-destructive">{identifierErrors[unit.id]}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {unit.floor === null ? "—" : unit.floor === 0 ? "R/C" : `${unit.floor}.º`}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{unit.typology || "—"}</td>
                  <td className="py-2.5">
                    <div>
                      <input
                        type="number"
                        defaultValue={unit.permilagem}
                        key={unit.permilagem}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
