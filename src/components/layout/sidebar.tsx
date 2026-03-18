"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
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
    ],
  },
  {
    labelKey: "nav.finances",
    items: [
      { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
      { href: "/financas/despesas", labelKey: "nav.expenses", icon: Receipt },
      { href: "/financas/orcamento", labelKey: "nav.budget", icon: PieChart },
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
      { href: "/contratos", labelKey: "nav.contracts", icon: FileSignature },
      { href: "/definicoes", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  userName: string;
  condominiumName: string;
}

export function Sidebar({ userName, condominiumName }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        {/* Logo & Condominium */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              OC
            </div>
            <span className="text-lg font-semibold text-foreground">
              OpenCondo
            </span>
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {condominiumName}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-2">
              {group.labelKey && (
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t(group.labelKey)}
                </p>
              )}
              {group.items.map((item) => {
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
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">Administrador</p>
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
