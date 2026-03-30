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
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  Plus,
  CalendarDays,
  BookOpen,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

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
    ],
  },
  {
    labelKey: "nav.finances",
    items: [
      { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
      { href: "/financas/despesas", labelKey: "nav.expenses", icon: Receipt, roles: ["ADMIN"] },
      { href: "/financas/orcamento", labelKey: "nav.budget", icon: PieChart },
      { href: "/financas/conta-gerencia", labelKey: "nav.annualReport", icon: FileText, roles: ["ADMIN"] },
      { href: "/financas/livro-caixa", labelKey: "nav.cashBalance", icon: BookOpen, roles: ["ADMIN"] },
    ],
  },
  {
    labelKey: "nav.communication",
    items: [
      { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
      { href: "/comunicacao/manutencao", labelKey: "nav.maintenance", icon: Wrench },
      { href: "/comunicacao/documentos", labelKey: "nav.documents", icon: FileText },
      { href: "/comunicacao/contactos", labelKey: "nav.contacts", icon: Phone },
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
    labelKey: "nav.management",
    items: [
      { href: "/calendario", labelKey: "nav.calendar", icon: CalendarDays },
      { href: "/contratos", labelKey: "nav.contracts", icon: FileSignature, roles: ["ADMIN"] },
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
  slug: string;
  role: string;
}

interface SidebarProps {
  userName: string;
  userRole: string;
  condominiumName: string;
  currentSlug: string;
  memberships: MembershipInfo[];
}

export function Sidebar({
  userName,
  userRole,
  condominiumName,
  currentSlug,
  memberships,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const prefix = `/c/${currentSlug}`;

  function handleSwitchCondo(slug: string) {
    setSwitcherOpen(false);
    router.push(`/c/${slug}/painel`);
  }

  return (
    <>
      {/* Sidebar — desktop only (mobile uses bottom bar) */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex"
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
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Condomínio ativo
            </p>
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/8 px-3 py-2 text-left transition-colors hover:bg-primary/15 cursor-pointer"
            >
              <Building2 size={16} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
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
                    onClick={() => handleSwitchCondo(m.slug)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-secondary",
                      m.slug === currentSlug &&
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
                  const fullHref = `${prefix}${item.href}`;
                  const isActive =
                    pathname === fullHref ||
                    (item.href !== "/painel" && pathname.startsWith(fullHref));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={fullHref}
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

        {/* User footer — Minha Conta link + logout */}
        <div className="border-t border-border">
          <Link
            href={`${prefix}/minha-conta`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {roleLabels[userRole] ?? userRole}
              </p>
            </div>
            <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
          </Link>
          <div className="px-4 pb-3">
            <button
              onClick={async () => {
                try { await signOut({ redirect: false }); } catch {}
                window.location.href = "/login";
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut size={14} />
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
