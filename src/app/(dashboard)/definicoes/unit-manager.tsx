"use client";

import { useState } from "react";
import { Upload, Home, User } from "lucide-react";
import { importUnitsFromCsv, assignUnitMember, updateUnitPermilagem } from "../actions";

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
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);

    const result = await importUnitsFromCsv(condominiumId, csvText);

    if (result.error) {
      setImportError(result.error);
    } else {
      setImportResult(result.message || "Importação concluída");
      setCsvText("");
      setShowImport(false);
    }
    setImporting(false);
  }

  async function handleAssign(unitId: string, userId: string | null, role: "owner" | "tenant") {
    const result = await assignUnitMember(unitId, userId, role);
    if (result.error) {
      setImportError(result.error);
    }
  }

  async function handlePermilagemChange(unitId: string, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    await updateUnitPermilagem(unitId, num);
  }

  const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          Frações ({units.length})
        </h2>
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Upload size={14} />
          Importar CSV
        </button>
      </div>

      {importError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {importError}
        </div>
      )}

      {importResult && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {importResult}
        </div>
      )}

      {/* CSV Import */}
      {showImport && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Importar frações via CSV
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Formato: identificador;piso;tipologia;permilagem;email
            <br />
            Exemplo: 1.º Esq;1;T2;150;joao@email.pt
          </p>
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="identificador;piso;tipologia;permilagem;email
1.º Esq;1;T2;150;joao@email.pt
1.º Dto;1;T3;180;"
            className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing || !csvText.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {importing ? "A importar..." : "Importar"}
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setCsvText("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Permilagem summary */}
      <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
        <span className="font-medium">Permilagem total: </span>
        <span className={totalPermilagem === 1000 ? "text-green-600" : "text-amber-600"}>
          {totalPermilagem}‰
        </span>
        {totalPermilagem !== 1000 && (
          <span className="ml-1 text-xs text-muted-foreground">
            (deve ser 1000‰)
          </span>
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
                <th className="pb-2 font-medium">Fração</th>
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
                  <td className="py-2.5 font-medium text-foreground">
                    {unit.identifier}
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {unit.floor || "—"}
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {unit.typology || "—"}
                  </td>
                  <td className="py-2.5">
                    <input
                      type="number"
                      defaultValue={unit.permilagem}
                      onBlur={(e) => handlePermilagemChange(unit.id, e.target.value)}
                      className="w-16 rounded border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                      min={0}
                      max={1000}
                    />
                  </td>
                  <td className="py-2.5">
                    <select
                      value={unit.ownerId || ""}
                      onChange={(e) =>
                        handleAssign(unit.id, e.target.value || null, "owner")
                      }
                      className="w-full max-w-[160px] rounded border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="">— Sem proprietário —</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.userName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5">
                    <select
                      value={unit.tenantId || ""}
                      onChange={(e) =>
                        handleAssign(unit.id, e.target.value || null, "tenant")
                      }
                      className="w-full max-w-[160px] rounded border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="">— Sem inquilino —</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.userName}
                        </option>
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
