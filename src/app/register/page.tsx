import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { randomPokemonId } from "@/lib/pokemon";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  const pokemonId = randomPokemonId();

  return (
    <AuthLayout pokemonId={pokemonId} subtitle="Create your own tracker">
      <RegisterForm pokemonId={pokemonId} />
    </AuthLayout>
  );
}
