-- Runnable core-context SQL aligned to the LifeSignal repository schema.
-- This script is intentionally limited to the subset discussed in review:
-- profiles, agencies, agency_members, monitored_people, contacts,
-- guardian_network, guardian_invites, schedules, waitlist_users.
--
-- Safe to run repeatedly due to IF NOT EXISTS and idempotent helpers.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type app_role as enum (
  'senior',
  'caregiver',
  'guardian',
  'agency_staff',
  'agency_admin',
  'platform_admin',
  'waitlist_only'
);

create type checkin_channel as enum ('sms', 'voice', 'app');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  phone text,
  role app_role not null default 'waitlist_only',
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'UTC',
  contact_email citext,
  contact_phone text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_agencies_updated on public.agencies;
create trigger trg_agencies_updated
before update on public.agencies
for each row execute function public.set_updated_at();

create table if not exists public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null check (role in ('agency_staff', 'agency_admin')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, profile_id)
);

create index if not exists idx_agency_members_profile on public.agency_members(profile_id);

drop trigger if exists trg_agency_members_updated on public.agency_members;
create trigger trg_agency_members_updated
before update on public.agency_members
for each row execute function public.set_updated_at();

create table if not exists public.monitored_people (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  preferred_name text,
  timezone text not null default 'UTC',
  date_of_birth date,
  phone text,
  quiet_hours_start time,
  quiet_hours_end time,
  vacation_mode boolean not null default false,
  vacation_start_date date,
  vacation_end_date date,
  emergency_mode_enabled boolean not null default false,
  medication_module_enabled boolean not null default false,
  recovery_module_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id)
);

create index if not exists idx_monitored_people_agency on public.monitored_people(agency_id);

drop trigger if exists trg_monitored_people_updated on public.monitored_people;
create trigger trg_monitored_people_updated
before update on public.monitored_people
for each row execute function public.set_updated_at();

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone text,
  email citext,
  timezone text default 'UTC',
  consent_to_notify boolean not null default true,
  priority_order int not null default 100,
  is_local_responder boolean not null default false,
  is_emergency_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_owner on public.contacts(owner_profile_id);

drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated
before update on public.contacts
for each row execute function public.set_updated_at();

create table if not exists public.guardian_network (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  guardian_profile_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  relationship text not null,
  permission_manage_schedules boolean not null default false,
  permission_manage_contacts boolean not null default false,
  permission_view_incidents boolean not null default true,
  permission_trigger_emergency boolean not null default true,
  is_primary boolean not null default false,
  priority_order int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (monitored_person_id, guardian_profile_id)
);

create index if not exists idx_guardian_network_guardian on public.guardian_network(guardian_profile_id);

drop trigger if exists trg_guardian_network_updated on public.guardian_network;
create trigger trg_guardian_network_updated
before update on public.guardian_network
for each row execute function public.set_updated_at();

create table if not exists public.guardian_invites (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  inviter_profile_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email citext,
  invitee_phone text,
  invite_token text not null unique,
  status text not null check (status in ('pending', 'accepted', 'expired', 'revoked')) default 'pending',
  accepted_profile_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guardian_invites_token on public.guardian_invites(invite_token);

drop trigger if exists trg_guardian_invites_updated on public.guardian_invites;
create trigger trg_guardian_invites_updated
before update on public.guardian_invites
for each row execute function public.set_updated_at();

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  name text not null,
  schedule_type text not null check (schedule_type in ('daily', 'weekly', 'custom')),
  channels checkin_channel[] not null,
  local_time time not null,
  timezone text not null,
  days_of_week int[] not null default '{0,1,2,3,4,5,6}',
  grace_minutes int not null default 15,
  max_retries int not null default 2,
  retry_interval_minutes int not null default 10,
  escalation_delay_minutes int not null default 15,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_schedules_monitored_person on public.schedules(monitored_person_id);

drop trigger if exists trg_schedules_updated on public.schedules;
create trigger trg_schedules_updated
before update on public.schedules
for each row execute function public.set_updated_at();

-- IMPORTANT:
-- use waitlist_users (not waitlist_entries) to match application code.
create table if not exists public.waitlist_users (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email citext not null unique,
  phone text,
  relationship_type text not null,
  city text,
  state text,
  referral_code text not null unique,
  referred_by_waitlist_user_id uuid references public.waitlist_users(id) on delete set null,
  beta_eligibility text not null default 'standard' check (beta_eligibility in ('standard','early_beta','guaranteed_beta','founder_reward')),
  referral_count int not null default 0,
  spots_gained int not null default 0,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_waitlist_users_joined_at on public.waitlist_users(joined_at asc);

drop trigger if exists trg_waitlist_users_updated on public.waitlist_users;
create trigger trg_waitlist_users_updated
before update on public.waitlist_users
for each row execute function public.set_updated_at();

commit;
