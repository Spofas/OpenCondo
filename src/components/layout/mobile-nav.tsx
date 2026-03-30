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
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

// Bottom bar items for non-admin roles (OWNER / TENANT)
const userBottomItems: NavItem[] = [
  { href: "/painel", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
  { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
  { href: "/assembleia/reunioes", labelKey: "nav.meetingsList", icon: Users },
  { href: "/minha-conta", labelKey: "nav.myAccount", icon: User },
];

// Admin category definitions
type CategoryKey = "financas" | "comunicacao" | "assembleias" | "gestao";

interface CategoryTab {
  key: CategoryKey;
  labelKey: string;
  icon: React.ElementType;
  pathPrefix: string; // for active state detection
  items: NavItem[];
  directHref?: string; // if set, tap goes here instead of opening sheet
}

const adminCategories: CategoryTab[] = [
  {
    key: "financas",
    labelKey: "nav.finances",
    icon: Wallet,
    pathPrefix: "/financas",
    items: [
      { href: "/financas/quotas", labelKey: "nav.quotas", icon: Wallet },
      { href: "/financas/despesas", labelKey: "nav.expenses", icon: Receipt },
      { href: "/financas/orcamento", labelKey: "nav.budget", icon: PieChart },
      { href: "/financas/conta-gerencia", labelKey: "nav.annualReport", icon: FileText },
      { href: "/financas/livro-caixa", labelKey: "nav.cashBalance", icon: BookOpen },
    ],
  },
  {
    key: "comunicacao",
    labelKey: "nav.communication",
    icon: Megaphone,
    pathPrefix: "/comunicacao",
    items: [
      { href: "/comunicacao/avisos", labelKey: "nav.announcements", icon: Megaphone },
      { href: "/comunicacao/manutencao", labelKey: "nav.maintenance", icon: Wrench },
      { href: "/comunicacao/documentos", labelKey: "nav.documents", icon: FileText },
      { href: "/comunicacao/contactos", labelKey: "nav.contacts", icon: Phone },
    ],
  },
  {
    key: "assembleias",
    labelKey: "nav.meetings",
    icon: Users,
    pathPrefix: "/assembleia",
    directHref: "/assembleia/reunioes",
    items: [
      { href: "/assembleia/reunioes", labelKey: "nav.meetingsList", icon: Users },
      { href: "/assembleia/atas", labelKey: "nav.minutes", icon: ScrollText },
    ],
  },
  {
    key: "gestao",
    labelKey: "nav.management",
    icon: Briefcase,
    pathPrefix: "", // matches multiple paths, handled in isCategoryActive
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
  const [openSheet, setOpenSheet] = useState<CategoryKey | null>(null);

  const isAdmin = userRole === "ADMIN";

  function isActive(href: string) {
    return pathname === href || (href !== "/painel" && pathname.startsWith(href));
  }

  function isCategoryActive(cat: CategoryTab) {
    if (cat.pathPrefix) {
      return pathname.startsWith(cat.pathPrefix);
    }
    // Gestão: active if on any of its item paths
    return cat.items.some((item) => isActive(item.href));
  }

  function handleCategoryTap(cat: CategoryTab) {
    if (cat.directHref) {
      // Close any open sheet and navigate
      setOpenSheet(null);
      return; // Link handles navigation
    }
    // Toggle the sheet
    setOpenSheet(openSheet === cat.key ? null : cat.key);
  }

  const activeSheetCategory = openSheet
    ? adminCategories.find((c) => c.key === openSheet)
    : null;

  return (
    <>
      {/* Category sheet overlay */}
      {openSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setOpenSheet(null)}
        />
      )}

      {/* Category sheet */}
      {activeSheetCategory && (
        <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-card pb-20 lg:hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-card-foreground">
              {t(activeSheetCategory.labelKey)}
            </h2>
            <button
              onClick={() => setOpenSheet(null)}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="px-3 py-2">
            {activeSheetCategory.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenSheet(null)}
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
          </nav>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden">
        <nav className="flex items-stretch justify-around">
          {isAdmin ? (
            <>
              {/* Dashboard — direct link */}
              <Link
                href="/painel"
                onClick={() => setOpenSheet(null)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  pathname === "/painel" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <LayoutDashboard size={20} />
                <span>{t("nav.dashboard")}</span>
              </Link>

              {/* Category tabs */}
              {adminCategories.map((cat) => {
                const Icon = cat.icon;
                const active = isCategoryActive(cat);
                const isSheetOpen = openSheet === cat.key;

                if (cat.directHref) {
                  return (
                    <Link
                      key={cat.key}
                      href={cat.directHref}
                      onClick={() => setOpenSheet(null)}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <Icon size={20} />
                      <span>{t(cat.labelKey)}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryTap(cat)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                      active || isSheetOpen ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Icon size={20} />
                    <span>{t(cat.labelKey)}</span>
                  </button>
                );
              })}
            </>
          ) : (
            /* Non-admin: direct links */
            userBottomItems.map((item) => {
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
            })
          )}
        </nav>
        {/* Safe area for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
