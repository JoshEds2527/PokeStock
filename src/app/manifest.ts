import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PokéStock",
    short_name: "PokéStock",
    description: "Stock, sales, and market tracker for Pokémon reselling",
    start_url: "/",
    display: "standalone",
    background_color: "#04141a",
    theme_color: "#22d3ee",
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
