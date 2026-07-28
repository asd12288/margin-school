/**
 * Reads the local mail catcher, so the password-reset loop can be tested for
 * real rather than stopping at "we said we sent an email".
 *
 * That gap matters more here than it usually would. `@supabase/ssr` pins PKCE,
 * whose token arrives in a URL fragment a server can never see, so the stock
 * Supabase templates cannot complete a reset in this app — and the failure is
 * silent, because sign-in keeps working. The only test that catches a
 * regression in `supabase/templates/` is one that actually opens the link.
 *
 * The Supabase CLI's mail container speaks the Mailpit API on 54324. Its
 * inbox is shared by every test in the run, so callers filter by a recipient
 * address they made unique — nothing here deletes messages, which would race
 * with tests running in parallel.
 */

const MAILPIT = process.env.SUPABASE_MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitSummary {
  ID: string;
  To: Array<{ Address: string }>;
  Subject: string;
}

/**
 * Waits for the newest message addressed to `recipient` and returns its body.
 *
 * Polls rather than subscribing: the send is a side effect of a form submit
 * that has already returned, so there is no promise to await, and a fixed
 * sleep would be either flaky or slow.
 */
export async function waitForEmail(
  recipient: string,
  { timeoutMs = 15_000, intervalMs = 250 } = {},
): Promise<{ subject: string; body: string }> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const listed = await fetch(`${MAILPIT}/api/v1/messages?limit=100`);
    if (listed.ok) {
      const { messages = [] } = (await listed.json()) as {
        messages?: MailpitSummary[];
      };

      const match = messages.find((message) =>
        message.To?.some(
          (to) => to.Address.toLowerCase() === recipient.toLowerCase(),
        ),
      );

      if (match) {
        const full = await fetch(`${MAILPIT}/api/v1/message/${match.ID}`);
        const detail = (await full.json()) as { HTML?: string; Text?: string };

        return {
          subject: match.Subject,
          body: detail.HTML || detail.Text || "",
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `No email arrived for ${recipient} within ${timeoutMs}ms. Is the local stack running (npm run db:start)?`,
  );
}

/**
 * Pulls our own confirmation link out of the email body.
 *
 * Deliberately matches `/auth/confirm` and not just any URL: the assertion
 * that the link points *there* is half the point of the test. A template that
 * regressed to Supabase's default `{{ .ConfirmationURL }}` would still contain
 * a perfectly valid-looking link, and the reset would still be broken.
 */
export function extractConfirmUrl(body: string): string {
  // The href is HTML-escaped in the message body (`&amp;` between params).
  const match = body.match(/https?:\/\/[^"'\s<>]*\/auth\/confirm[^"'\s<>]*/);

  if (!match) {
    throw new Error(
      "No /auth/confirm link in the email. Check supabase/templates/ — a stock Supabase template links to {{ .ConfirmationURL }} instead, which this app cannot complete.",
    );
  }

  return match[0].replace(/&amp;/g, "&");
}
