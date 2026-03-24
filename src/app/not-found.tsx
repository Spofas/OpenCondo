import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="mt-4 text-muted-foreground">
          A página que procura não existe ou foi movida.
        </p>
        <Link
          href="/painel"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
