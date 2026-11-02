-- Migration 021: Google OAuth Support & Profile Avatars
-- Gulfam Sweets & Dairy e-Commerce Platform

-- 1. Ensure avatar_url column exists on public.profiles
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Update handle_new_auth_user to capture Google OAuth metadata (full_name, name, picture, avatar_url)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
  v_phone text;
begin
  -- Resolve user display name from email signup or Google OAuth provider metadata
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1)
  );

  -- Resolve avatar picture URL from Google OAuth
  v_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  -- Resolve phone number if present
  v_phone := nullif(new.raw_user_meta_data ->> 'phone', '');

  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (
    new.id,
    v_name,
    new.email,
    v_phone,
    v_avatar
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        phone = coalesce(excluded.phone, public.profiles.phone),
        updated_at = now();
  return new;
end;
$$;

-- 3. Recreate the trigger on auth.users
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

