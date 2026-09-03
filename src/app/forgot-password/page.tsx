import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { randomPokemonId } from "@/lib/pokemon";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect("/");

  const pokemonId = randomPokemonId();

  return (
    <AuthLayout pokemonId={pokemonId} subtitle="Reset your password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
