"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Wallet,
  Megaphone,
  Users,
  Settings,
  MoreHorizontal,
  X,
  Receipt,
  PieChart,
  FileText,
  Wrench,
  Phone,
  ScrollText,
  FileSignature,
  CalendarDays,
  BookOpen,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Bottom bar items for non-admin roles (OWNER / TENANT)
const userBottomItems: NavItem[] = [
  { href: "/painel", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
  { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
  { href: "/assembleia/reunioes", labelKey: "nav.meetingsList", icon: Users },
  { href: "/minha-conta", labelKey: "nav.myAccount", icon: User },
];

// Bottom bar items for admin — 4 key items + "More"
const adminBottomItems: NavItem[] = [
  { href: "/painel", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
  { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
  { href: "/definicoes", labelKey: "nav.settings", icon: Settings },
];

// Full nav for the "More" sheet (admin only) — grouped
const adminMoreGroups: NavGroup[] = [
  {
    label: "Finanças",
    items: [
      { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
      { href: "/financas/despesas", labelKey: "nav.expenses", icon: Receipt },
      { href: "/financas/orcamento", labelKey: "nav.budget", icon: PieChart },
      { href: "/financas/conta-gerencia", labelKey: "nav.annualReport", icon: FileText },
      { href: "/financas/livro-caixa", labelKey: "nav.cashBalance", icon: BookOpen },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
      { href: "/comunicacao/manutencao", labelKey: "nav.maintenance", icon: Wrench },
      { href: "/comunicacao/documentos", labelKey: "nav.documents", icon: FileText },
      { href: "/comunicacao/contactos", labelKey: "nav.contacts", icon: Phone },
    ],
  },
  {
    label: "Assembleias",
    items: [
      { href: "/assembleia/reunioes", labelKey: "nav.meetingsList", icon: Users },
      { href: "/assembleia/atas", labelKey: "nav.minutes", icon: ScrollText },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/calendario", labelKey: "nav.calendar", icon: CalendarDays },
      { href: "/contratos", labelKey: "nav.contracts", icon: FileSignature },
      { href: "/definicoes", labelKey: "nav.settings", icon: Settings },
      { href: "/minha-conta", labelKey: "nav.myAccount", icon: User },
    ],
  },
];

export function MobileNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const t = useTranslations();
  const [moreOpen, setMoreOpen] = useState(false);

  const isAdmin = userRole === "ADMIN";
  const bottomItems = isAdmin ? adminBottomItems : userBottomItems;

  function isActive(href: string) {
    return pathname === href || (href !== "/painel" && pathname.startsWith(href));
  }

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card pb-20 lg:hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-card-foreground">Menu</h2>
            <button
              onClick={() => setMoreOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="px-3 py-3">
            {adminMoreGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
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
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden">
        <nav className="flex items-stretch justify-around">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={20} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}

          {/* "More" button for admin */}
          {isAdmin && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                moreOpen ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal size={20} />
              <span>Mais</span>
            </button>
          )}
        </nav>
        {/* Safe area for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
