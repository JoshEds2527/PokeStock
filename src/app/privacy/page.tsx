import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="3 September 2026">
      <p>
        This page explains what data PokéStock collects and how it&apos;s
        used. As with the Terms of Service, treat this as a plain-English
        starting point rather than professionally drafted legal text.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Your name, email address, and a securely hashed password.</li>
        <li>
          The business data you choose to enter: products, purchases, sales,
          and releases you track.
        </li>
        <li>
          Basic account activity: when your account was created and when it
          last logged in.
        </li>
      </ul>

      <h2>How it&apos;s used</h2>
      <p>
        Solely to run your account and the app&apos;s features — showing your
        dashboard, sending a password-reset link when you ask for one, and
        letting the developer account manage the shared release list and
        remove inactive or abusive accounts.
      </p>

      <h2>Sharing</h2>
      <p>
        We don&apos;t sell your data or share it with third parties for
        marketing. If you request a password reset, your email address is
        passed to our email provider (Resend) solely to deliver that one
        email.
      </p>

      <h2>Cookies</h2>
      <p>
        The app sets a single session cookie to keep you signed in. There are
        no advertising or analytics tracking cookies.
      </p>

      <h2>Passwords</h2>
      <p>
        Passwords are hashed (bcrypt) before storage — we can&apos;t see or
        recover your actual password, only reset it via the forgot-password
        flow.
      </p>

      <h2>Your data, your account</h2>
      <p>
        You can ask to have your account and its data deleted at any time.
        Deleting an account removes your inventory, purchases, and sales;
        anything you added to the shared release list stays visible to other
        accounts (since it&apos;s shared, public information) but is no
        longer linked to your account.
      </p>

      <h2>Changes</h2>
      <p>
        This policy may be updated from time to time. Continuing to use the
        app after a change means you accept the updated policy.
      </p>
    </LegalPage>
  );
}
