import { pokemonArtworkUrl } from "@/lib/pokemon";

// Ambient version of the login screen's colour wash, using that session's
// own Pokemon, so the glass panels throughout the app have something
// consistent and colourful to show through. Falls back to a plain dark
// gradient for sessions issued before this feature existed.
export function AppBackdrop({ pokemonId }: { pokemonId?: number }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      {pokemonId && (
        <img
          src={pokemonArtworkUrl(pokemonId)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/10 to-slate-950/40" />
    </div>
  );
}
