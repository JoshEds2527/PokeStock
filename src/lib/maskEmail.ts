// Partially obscures an email for display/logging, e.g. "psyjands@gmail.com"
// -> "p******s@g***l.com". Never used for lookups -- only ever shown, so a
// leaked screenshot, browser history entry, or server log can't be used to
// guess or target a real address.
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;

  const maskPart = (part: string) => {
    if (part.length <= 2) return part[0] + "*".repeat(Math.max(1, part.length - 1));
    return part[0] + "*".repeat(part.length - 2) + part.slice(-1);
  };

  const [domainName, ...tld] = domain.split(".");
  return `${maskPart(user)}@${maskPart(domainName)}${tld.length ? "." + tld.join(".") : ""}`;
}
