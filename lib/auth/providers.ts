/**
 * Which sign-in methods this deployment actually offers.
 *
 * Google needs a Google Cloud OAuth client, a client secret in the Supabase
 * project, and a redirect URI registered on Google's side — none of which live
 * in this repo. Rendering the button regardless would give every fresh clone a
 * button that fails on click, and the failure ("Unsupported provider") arrives
 * two origins away from anything a developer could read.
 *
 * So the button is a function of configuration, not a constant. Email and
 * password always work; Google appears when someone has done the setup.
 *
 * `NEXT_PUBLIC_` because the flag is read while rendering the auth screens and
 * it carries nothing secret — only whether a button is drawn. The credentials
 * themselves stay server-side, in the Supabase stack rather than in this app;
 * this process never sees them.
 */
export const GOOGLE_SIGN_IN_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
