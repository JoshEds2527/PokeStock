import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="3 September 2026">
      <p>
        These terms cover your use of PokéStock, a stock, sales, and finance
        tracker for Pokémon reselling. This is a small, independently-run tool —
        please read this as a plain-English starting point rather than
        professionally drafted legal text, and treat it as something to have
        reviewed properly before relying on it for a larger or commercial launch.
      </p>

      <h2>Your account</h2>
      <p>
        You&apos;re responsible for keeping your login details secure and for
        anything done through your account. This app is deliberately built so
        two people can share one account and see the same data — if you do
        that, you&apos;re both responsible for how that shared account is used.
      </p>

      <h2>The shared release list</h2>
      <p>
        Anything added to the shared release catalog is visible to every
        account on the app. Please keep entries accurate and don&apos;t post
        anything abusive, misleading, or unrelated to product releases.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use the service for anything unlawful.</li>
        <li>
          Don&apos;t attempt to disrupt, overload, or gain unauthorised access
          to the service or other accounts.
        </li>
        <li>Don&apos;t scrape or resell the data in this app in bulk.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The service is provided &quot;as is&quot;. Figures like profit, average
        cost, and market links are calculated from what you enter and are for
        your own tracking purposes — they&apos;re not financial or tax advice,
        and we don&apos;t guarantee the service will always be available or
        error-free.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        We aren&apos;t liable for financial or business decisions you make
        based on data stored in or displayed by this app, or for losses
        arising from downtime, bugs, or data loss, to the fullest extent
        permitted by law.
      </p>

      <h2>Ending an account</h2>
      <p>
        The account holder can stop using the service at any time. The
        developer account may remove accounts that are inactive, abusive, or
        otherwise breach these terms; removing an account deletes its data as
        described in the Privacy Policy.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated from time to time. Continuing to use the
        app after a change means you accept the updated terms.
      </p>
    </LegalPage>
  );
}
