import { maskEmail } from "@/lib/maskEmail";

// Minimal email sender via Resend's HTTP API (https://resend.com) -- no SDK,
// just fetch, so there's nothing to install. Without RESEND_API_KEY set,
// emails are logged to the server console instead of sent, which is enough
// to develop and test the password-reset flow locally.
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Masked here on purpose -- this is server console/log output, which can
    // end up somewhere more widely readable than the email itself would be.
    console.log(
      `\n--- Email not sent (no RESEND_API_KEY set) ---\nTo: ${maskEmail(to)}\nSubject: ${subject}\n\n${text}\n---\n`
    );
    return;
  }

  const from = process.env.EMAIL_FROM || "PokéStock <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    console.error("Failed to send email via Resend:", await res.text());
  }
}
