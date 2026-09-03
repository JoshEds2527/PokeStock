import Link from "next/link";
import { Logo } from "@/components/Logo";
import { pokemonArtworkUrl, pokemonName } from "@/lib/pokemon";

export function AuthLayout({
  pokemonId,
  subtitle,
  children,
}: {
  pokemonId: number;
  subtitle: string;
  children: React.ReactNode;
}) {
  const artworkUrl = pokemonArtworkUrl(pokemonId);

  return (
    <div className="relative min-h-screen md:flex overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      {/* One continuous colour wash behind both panels, so they match exactly */}
      <img
        src={artworkUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/10 to-slate-950/70" />

      {/* Artwork: banner on top on mobile, right-hand panel on desktop */}
      <div className="relative order-1 md:order-2 h-56 md:h-auto md:w-1/2 flex items-center justify-center">
        <img
          src={artworkUrl}
          alt={pokemonName(pokemonId)}
          className="w-[70%] h-[70%] max-w-[420px] max-h-[420px] object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
        />
        <p className="absolute bottom-3 right-4 text-[11px] text-white/50 tracking-wide">
          Featuring {pokemonName(pokemonId)}
        </p>
      </div>

      {/* Form panel */}
      <div className="relative order-2 md:order-1 md:w-1/2 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Logo size={32} />
            <h1 className="text-2xl font-bold text-white">PokéStock</h1>
          </div>
          <p className="text-white/70 text-sm text-center mb-6">{subtitle}</p>
          {children}
          <div className="flex gap-4 justify-center mt-6 text-xs text-white/50">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
