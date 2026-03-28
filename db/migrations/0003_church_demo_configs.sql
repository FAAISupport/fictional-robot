begin;

create table if not exists public.church_demo_configs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  church_name text not null,
  city text not null,
  weekly_attendance int not null check (weekly_attendance > 0),
  pastors_count int not null check (pastors_count > 0),
  selected_modules text[] not null,
  generated_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_church_demo_configs_slug on public.church_demo_configs(slug);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_church_demo_configs_updated
before update on public.church_demo_configs
for each row execute function public.set_updated_at();

alter table public.church_demo_configs enable row level security;

create policy church_demo_public_read
on public.church_demo_configs
for select
using (true);

create policy church_demo_platform_write
on public.church_demo_configs
for all
using (public.current_user_role() = 'platform_admin')
with check (public.current_user_role() = 'platform_admin');

commit;
