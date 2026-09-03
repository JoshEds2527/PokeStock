import { Logo } from "@/components/Logo";
import { pokemonArtworkUrl, pokemonName } from "@/lib/pokemon";

export function SessionBadge({
  pokemonId,
  size = 28,
}: {
  pokemonId?: number;
  size?: number;
}) {
  if (!pokemonId) return <Logo size={size} />;

  return (
    <img
      src={pokemonArtworkUrl(pokemonId)}
      alt={pokemonName(pokemonId)}
      title={pokemonName(pokemonId)}
      width={size}
      height={size}
      className="rounded-lg bg-indigo-50 object-contain shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
