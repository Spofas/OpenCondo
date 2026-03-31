"use client";

import { createContext, useContext } from "react";

interface CondominiumContextValue {
  slug: string;
  condominiumId: string;
}

const CondominiumContext = createContext<CondominiumContextValue | null>(null);

export function CondominiumProvider({
  slug,
  condominiumId,
  children,
}: CondominiumContextValue & { children: React.ReactNode }) {
  return (
    <CondominiumContext.Provider value={{ slug, condominiumId }}>
      {children}
    </CondominiumContext.Provider>
  );
}

export function useCondominium(): CondominiumContextValue {
  const ctx = useContext(CondominiumContext);
  if (!ctx) {
    throw new Error("useCondominium must be used within a CondominiumProvider");
  }
  return ctx;
}
