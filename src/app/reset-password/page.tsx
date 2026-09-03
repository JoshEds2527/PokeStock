import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthLayout } from "@/components/AuthLayout";
import { randomPokemonId } from "@/lib/pokemon";
import { hashResetToken } from "@/lib/resetToken";
import { maskEmail } from "@/lib/maskEmail";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { token } = await searchParams;
  const pokemonId = randomPokemonId();

  let maskedEmail: string | null = null;
  let tokenValid = false;

  if (token) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      include: { account: { select: { email: true } } },
    });
    tokenValid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();
    if (tokenValid && resetToken) {
      maskedEmail = maskEmail(resetToken.account.email);
    }
  }

  return (
    <AuthLayout pokemonId={pokemonId} subtitle="Choose a new password">
      {tokenValid && token ? (
        <ResetPasswordForm token={token} maskedEmail={maskedEmail} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 text-center">
          <p className="text-sm text-slate-700">
            {token
              ? "This reset link is invalid or has expired."
              : "This reset link is missing its token."}{" "}
            Request a new one below.
          </p>
          <Link
            href="/forgot-password"
            className="text-sm text-indigo-600 hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
