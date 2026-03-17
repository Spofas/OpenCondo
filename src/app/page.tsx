import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-2xl px-6 text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            OC
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            OpenCondo
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Gestão simples e eficaz do seu condomínio.
            <br />
            Finanças, comunicação, assembleias e contratos — tudo num só lugar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/registar"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Criar conta
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Iniciar sessão
          </Link>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Open source · Feito para o mercado português 🇵🇹
        </p>
      </main>
    </div>
  );
}
