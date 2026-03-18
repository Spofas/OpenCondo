"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  Megaphone,
  Wrench,
  FileText,
  Users,
  ScrollText,
  FileSignature,
  Settings,
  Menu,
  UserCircle,
  X,
  LogOut,
  ChevronDown,
  Building2,
  Plus,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { switchCondominium } from "@/app/(dashboard)/actions";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles?: string[]; // if undefined, all roles can see it
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    labelKey: "",
    items: [
      { href: "/painel", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/calendario", labelKey: "nav.calendar", icon: CalendarDays },
    ],
  },
  {
    labelKey: "nav.finances",
    items: [
      { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
      { href: "/financas/despesas", labelKey: "nav.expenses", icon: Receipt, roles: ["ADMIN"] },
      { href: "/financas/orcamento", labelKey: "nav.budget", icon: PieChart },
      { href: "/financas/devedores", labelKey: "nav.debtors", icon: AlertTriangle, roles: ["ADMIN"] },
      { href: "/financas/despesas-recorrentes", labelKey: "nav.recurringExpenses", icon: RefreshCw, roles: ["ADMIN"] },
      { href: "/financas/conta-gerencia", labelKey: "nav.annualReport", icon: FileText, roles: ["ADMIN"] },
    ],
  },
  {
    labelKey: "nav.communication",
    items: [
      { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
      { href: "/comunicacao/manutencao", labelKey: "nav.maintenance", icon: Wrench },
      { href: "/comunicacao/documentos", labelKey: "nav.documents", icon: FileText },
    ],
  },
  {
    labelKey: "nav.meetings",
    items: [
      { href: "/assembleia/reunioes", labelKey: "nav.meetingsList", icon: Users },
      { href: "/assembleia/atas", labelKey: "nav.minutes", icon: ScrollText },
    ],
  },
  {
    labelKey: "",
    items: [
      { href: "/contratos", labelKey: "nav.contracts", icon: FileSignature, roles: ["ADMIN"] },
      { href: "/minha-conta", labelKey: "nav.myAccount", icon: UserCircle },
      { href: "/definicoes", labelKey: "nav.settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  OWNER: "Proprietário",
  TENANT: "Inquilino",
};

interface MembershipInfo {
  condominiumId: string;
  condominiumName: string;
  role: string;
}

interface SidebarProps {
  userName: string;
  userRole: string;
  condominiumName: string;
  currentCondominiumId: string;
  memberships: MembershipInfo[];
}

export function Sidebar({
  userName,
  userRole,
  condominiumName,
  currentCondominiumId,
  memberships,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);



  async function handleSwitchCondo(condominiumId: string) {
    setSwitcherOpen(false);
    await switchCondominium(condominiumId);
    router.refresh();
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
        aria-label="Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Condominium Switcher */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              OC
            </div>
            <span className="text-lg font-semibold text-foreground">
              OpenCondo
            </span>
          </div>

          {/* Condominium selector */}
          <div className="relative mt-3">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary cursor-pointer"
            >
              <Building2 size={14} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {condominiumName}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 text-muted-foreground transition-transform",
                  switcherOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {switcherOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card py-1 shadow-lg">
                {memberships.map((m) => (
                  <button
                    key={m.condominiumId}
                    onClick={() => handleSwitchCondo(m.condominiumId)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-secondary",
                      m.condominiumId === currentCondominiumId &&
                        "bg-primary/5 font-medium"
                    )}
                  >
                    <Building2 size={14} className="shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-foreground">
                        {m.condominiumName}
                      </p>
                      <p className="text-muted-foreground">
                        {roleLabels[m.role] ?? m.role}
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <Link
                    href="/iniciar"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <Plus size={14} />
                    Adicionar condomínio
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation — filtered by role */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group, groupIdx) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(userRole)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="mb-2">
                {group.labelKey && (
                  <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t(group.labelKey)}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/painel" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-sidebar-active"
                          : "text-sidebar-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon size={18} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {roleLabels[userRole] ?? userRole}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={t("auth.logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
