// Decorative only: picks a random original-151 Pokémon to feature on the
// login/register screen and as that session's small logo badge. Artwork is
// hotlinked from PokeAPI's public sprite mirror (github.com/PokeAPI/sprites).
// Note: this is Nintendo/Game Freak/Creatures-owned character art, fine for
// personal use but should be replaced with licensed or original artwork
// before this app is ever sold or monetized.

const KANTO_NAMES = [
  "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
  "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
  "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata",
  "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu",
  "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen",
  "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix",
  "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish",
  "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett",
  "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape",
  "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra",
  "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout",
  "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude",
  "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro",
  "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel",
  "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter",
  "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb",
  "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee",
  "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon",
  "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen",
  "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx",
  "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados",
  "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon",
  "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax",
  "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite",
  "Mewtwo", "Mew",
];

export const POKEMON_COUNT = KANTO_NAMES.length; // 151

export function randomPokemonId(): number {
  return Math.floor(Math.random() * POKEMON_COUNT) + 1;
}

export function isValidPokemonId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= POKEMON_COUNT;
}

export function pokemonName(id: number): string {
  return KANTO_NAMES[id - 1] ?? `#${id}`;
}

export function pokemonArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
