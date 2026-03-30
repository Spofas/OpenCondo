"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-foreground">Erro inesperado</h1>
        <p className="mt-4 text-muted-foreground">
          Ocorreu um erro ao processar o seu pedido. Por favor, tente novamente.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Referência: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
