import Link from "next/link"
import { BookOpen, Home } from "lucide-react"
import { Wordmark } from "@/components/brand/Wordmark"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF6EB] px-xl py-4xl text-[#100908]">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <Link href="/" className="mb-2xl inline-block transition-opacity hover:opacity-85">
          <Wordmark className="h-10 w-auto" />
        </Link>

        <span className="font-serif text-[72px] font-bold leading-none tracking-tight text-[#E04070] md:text-[96px]">
          404
        </span>

        <h1 className="mt-md font-serif text-[28px] font-bold tracking-tight text-[#100908] md:text-[34px]">
          Cette page n'existe pas
        </h1>

        <p className="mt-sm text-sm leading-relaxed text-[#100908]/75">
          Le lien que vous avez suivi est peut-être rompu ou la page a été supprimée ou déplacée.
        </p>

        <div className="mt-2xl flex flex-wrap items-center justify-center gap-md">
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center gap-xs rounded-lg bg-[#E04070] px-xl py-md text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#B84870]"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
          <Link
            href="/catalog"
            className="inline-flex cursor-pointer items-center gap-xs rounded-lg border border-[#100908]/20 bg-white/70 px-xl py-md text-sm font-semibold text-[#100908] transition-colors hover:bg-white"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Voir le catalogue
          </Link>
        </div>
      </div>
    </main>
  )
}
