import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { AuthLayout } from "@/components/AuthLayout";
import { randomPokemonId } from "@/lib/pokemon";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  const pokemonId = randomPokemonId();

  return (
    <AuthLayout pokemonId={pokemonId} subtitle="Sign in to your stock tracker">
      <LoginForm pokemonId={pokemonId} />
    </AuthLayout>
  );
}
