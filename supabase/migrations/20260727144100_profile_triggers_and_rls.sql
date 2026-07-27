-- Profile lifecycle and row-level security.
--
-- HAND-WRITTEN. drizzle-kit generates tables, columns and constraints — it
-- does not generate triggers, functions or policies, and it does not track
-- them in its snapshots. Keep all of those in files like this one.
-- (This is also why `drizzle-kit push` is banned: it would drop everything
-- below without warning. See docs/environments.md.)

-- ---------------------------------------------------------------------------
-- Create a profile row whenever a user signs up.
--
-- Implemented in the database rather than in application code because it must
-- fire for every signup path: password, OAuth, magic link, and users created
-- from the Supabase dashboard. A handler in the signup route would silently
-- miss all but the first, and the failure would be invisible until someone
-- had no profile.
--
-- `security definer` so it can write to public.profile regardless of who is
-- signing up; `search_path = ''` per Supabase's guidance, which forces every
-- identifier below to be fully qualified and prevents search-path hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep updated_at honest. A default only covers insert.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profile_set_updated_at
  before update on public.profile
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security.
--
-- Defence in depth, not the access layer: the browser never queries the
-- database directly, and all reads and writes go through our server layer
-- using the secret key, which bypasses RLS.
-- See docs/decisions/0003-tech-stack.md.
--
-- One policy only — a signed-in user may read their own row. There are
-- deliberately NO insert, update or delete policies, so anything reaching the
-- database with an anon or authenticated key can only ever read itself.
-- ---------------------------------------------------------------------------
alter table public.profile enable row level security;

-- Table-level grants must exist before a policy can do anything. Postgres
-- checks GRANT first and RLS second, so a policy on a table with no GRANT is
-- unreachable — the request fails with "permission denied for table" and the
-- policy is never evaluated.
--
-- Tables created through the Supabase dashboard get these implicitly. Tables
-- created by a Drizzle migration do not, so they are explicit here.
--
-- `anon` is granted nothing: a signed-out visitor has no profile to read.
grant select on public.profile to authenticated;
grant select, insert, update, delete on public.profile to service_role;

create policy "profile_select_own"
  on public.profile
  for select
  to authenticated
  -- `(select auth.uid())` rather than a bare call: Postgres evaluates it once
  -- per statement instead of once per row.
  using ((select auth.uid()) = id);
