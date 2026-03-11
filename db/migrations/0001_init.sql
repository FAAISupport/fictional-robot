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
create type checkin_status as enum ('scheduled', 'pending', 'in_progress', 'responded', 'missed', 'cancelled');
create type escalation_status as enum ('pending', 'in_progress', 'acknowledged', 'resolved', 'cancelled');
create type notification_status as enum ('queued', 'sent', 'delivered', 'failed', 'read', 'acknowledged');
create type incident_status as enum ('open', 'investigating', 'resolved', 'closed');
create type risk_level as enum ('stable', 'caution', 'elevated', 'high');
create type trend_direction as enum ('improving', 'stable', 'worsening');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
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
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

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
create trigger trg_agencies_updated before update on public.agencies for each row execute function public.set_updated_at();

create table if not exists public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null check (role in ('agency_staff','agency_admin')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, profile_id)
);
create index idx_agency_members_profile on public.agency_members(profile_id);
create trigger trg_agency_members_updated before update on public.agency_members for each row execute function public.set_updated_at();

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
create index idx_monitored_people_agency on public.monitored_people(agency_id);
create trigger trg_monitored_people_updated before update on public.monitored_people for each row execute function public.set_updated_at();

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
create index idx_contacts_owner on public.contacts(owner_profile_id);
create trigger trg_contacts_updated before update on public.contacts for each row execute function public.set_updated_at();

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
create index idx_guardian_network_guardian on public.guardian_network(guardian_profile_id);
create trigger trg_guardian_network_updated before update on public.guardian_network for each row execute function public.set_updated_at();

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
create index idx_guardian_invites_token on public.guardian_invites(invite_token);
create trigger trg_guardian_invites_updated before update on public.guardian_invites for each row execute function public.set_updated_at();

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
create index idx_schedules_monitored_person on public.schedules(monitored_person_id);
create trigger trg_schedules_updated before update on public.schedules for each row execute function public.set_updated_at();

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  expected_at timestamptz not null,
  due_at timestamptz not null,
  status checkin_status not null default 'scheduled',
  channel_preference checkin_channel not null,
  attempts_used int not null default 0,
  responded_at timestamptz,
  response_latency_minutes int,
  response_source text check (response_source in ('sms','voice','dashboard','caregiver','system')),
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_checkins_due_status on public.checkins(status, due_at);
create index idx_checkins_monitored_date on public.checkins(monitored_person_id, expected_at desc);
create trigger trg_checkins_updated before update on public.checkins for each row execute function public.set_updated_at();

create table if not exists public.checkin_attempts (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  attempt_number int not null,
  channel checkin_channel not null,
  initiated_at timestamptz not null default now(),
  status notification_status not null default 'queued',
  provider_message_id text,
  provider_call_id text,
  delivery_status text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (checkin_id, attempt_number, channel)
);
create index idx_checkin_attempts_checkin on public.checkin_attempts(checkin_id);

create table if not exists public.checkin_responses (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  channel checkin_channel not null,
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_response text not null,
  is_valid boolean not null,
  received_at timestamptz not null default now(),
  source_contact text,
  created_at timestamptz not null default now()
);
create index idx_checkin_responses_checkin on public.checkin_responses(checkin_id);

create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  checkin_id uuid references public.checkins(id) on delete set null,
  status escalation_status not null default 'pending',
  reason text not null,
  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_escalations_status_triggered on public.escalations(status, triggered_at);
create trigger trg_escalations_updated before update on public.escalations for each row execute function public.set_updated_at();

create table if not exists public.escalation_steps (
  id uuid primary key default gen_random_uuid(),
  escalation_id uuid not null references public.escalations(id) on delete cascade,
  step_order int not null,
  contact_id uuid references public.contacts(id) on delete set null,
  guardian_profile_id uuid references public.profiles(id) on delete set null,
  channel checkin_channel not null,
  delay_minutes int not null default 0,
  execute_after timestamptz not null,
  executed_at timestamptz,
  requires_ack boolean not null default true,
  status text not null check (status in ('pending', 'sent', 'failed', 'acknowledged', 'skipped')) default 'pending',
  ack_token text unique,
  created_at timestamptz not null default now(),
  unique (escalation_id, step_order)
);
create index idx_escalation_steps_execute on public.escalation_steps(status, execute_after);

create table if not exists public.escalation_events (
  id uuid primary key default gen_random_uuid(),
  escalation_id uuid not null references public.escalations(id) on delete cascade,
  escalation_step_id uuid references public.escalation_steps(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_escalation_events_escalation on public.escalation_events(escalation_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  monitored_person_id uuid references public.monitored_people(id) on delete set null,
  category text not null,
  title text not null,
  body text not null,
  status notification_status not null default 'queued',
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notifications_profile_created on public.notifications(profile_id, created_at desc);
create trigger trg_notifications_updated before update on public.notifications for each row execute function public.set_updated_at();

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  escalation_id uuid references public.escalations(id) on delete set null,
  incident_type text not null,
  status incident_status not null default 'open',
  severity text not null check (severity in ('low','medium','high','critical')),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_incidents_status_opened on public.incidents(status, opened_at desc);
create trigger trg_incidents_updated before update on public.incidents for each row execute function public.set_updated_at();

create table if not exists public.incident_resolutions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  resolved_by uuid references public.profiles(id),
  outcome text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.health_notes (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  authored_by uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  visibility text not null check (visibility in ('senior','caregiver','agency','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_health_notes_updated before update on public.health_notes for each row execute function public.set_updated_at();

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  name text not null,
  dosage text,
  schedule_rule text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_medications_monitored_person on public.medications(monitored_person_id);
create trigger trg_medications_updated before update on public.medications for each row execute function public.set_updated_at();

create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  expected_at timestamptz not null,
  confirmed_at timestamptz,
  status text not null check (status in ('pending','confirmed','missed')),
  confirmation_source text check (confirmation_source in ('sms','voice','dashboard','caregiver')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_medication_logs_person_expected on public.medication_logs(monitored_person_id, expected_at desc);
create trigger trg_medication_logs_updated before update on public.medication_logs for each row execute function public.set_updated_at();

create table if not exists public.recovery_programs (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  program_type text not null,
  schedule_rule text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_recovery_programs_updated before update on public.recovery_programs for each row execute function public.set_updated_at();

create table if not exists public.recovery_checkins (
  id uuid primary key default gen_random_uuid(),
  recovery_program_id uuid not null references public.recovery_programs(id) on delete cascade,
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  expected_at timestamptz not null,
  responded_at timestamptz,
  status text not null check (status in ('pending','responded','missed')),
  response_channel checkin_channel,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_recovery_checkins_person_expected on public.recovery_checkins(monitored_person_id, expected_at desc);
create trigger trg_recovery_checkins_updated before update on public.recovery_checkins for each row execute function public.set_updated_at();

create table if not exists public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  triggered_by uuid references public.profiles(id),
  trigger_source text not null check (trigger_source in ('sms','voice','dashboard','caregiver','automatic')),
  status text not null check (status in ('triggered','acknowledged','resolved')) default 'triggered',
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_emergency_events_person_created on public.emergency_events(monitored_person_id, created_at desc);
create trigger trg_emergency_events_updated before update on public.emergency_events for each row execute function public.set_updated_at();

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  latitude numeric(9,6),
  longitude numeric(9,6),
  accuracy_meters int,
  source text not null,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index idx_locations_person_recorded on public.locations(monitored_person_id, recorded_at desc);

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
create index idx_waitlist_users_joined_at on public.waitlist_users(joined_at asc);
create trigger trg_waitlist_users_updated before update on public.waitlist_users for each row execute function public.set_updated_at();

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_waitlist_user_id uuid not null references public.waitlist_users(id) on delete cascade,
  referred_waitlist_user_id uuid not null references public.waitlist_users(id) on delete cascade,
  referral_code text not null,
  status text not null check (status in ('pending','qualified','rejected')) default 'qualified',
  created_at timestamptz not null default now(),
  unique (referrer_waitlist_user_id, referred_waitlist_user_id)
);
create index idx_referrals_referrer on public.referrals(referrer_waitlist_user_id, created_at desc);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  waitlist_user_id uuid not null references public.waitlist_users(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_type text not null check (snapshot_type in ('all_time','weekly','geo')),
  region_key text,
  waitlist_user_id uuid not null references public.waitlist_users(id) on delete cascade,
  rank int not null,
  referral_count int not null,
  score int not null,
  snapshot_date date not null,
  region_key_normalized text generated always as (coalesce(region_key, '')) stored,
  created_at timestamptz not null default now(),
  unique (snapshot_type, region_key_normalized, waitlist_user_id, snapshot_date)
);
create index idx_leaderboard_snapshots_lookup on public.leaderboard_snapshots(snapshot_type, snapshot_date, rank);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  plan_code text not null check (plan_code in ('family','caregiver','enterprise')),
  status subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_subscriptions_profile on public.subscriptions(profile_id);
create trigger trg_subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_billing_events_type_created on public.billing_events(event_type, created_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  event_category text not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_analytics_events_category_time on public.analytics_events(event_category, occurred_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id, created_at desc);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  channel checkin_channel not null,
  locale text not null default 'en-US',
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_message_templates_updated before update on public.message_templates for each row execute function public.set_updated_at();

create table if not exists public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid references public.monitored_people(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  channel checkin_channel not null,
  direction text not null check (direction in ('inbound','outbound')),
  provider text not null,
  provider_message_id text,
  provider_call_id text,
  status text not null,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_communication_logs_provider_status on public.communication_logs(provider, status, occurred_at desc);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  description text,
  enabled boolean not null default false,
  scope text not null default 'global' check (scope in ('global','agency','profile')),
  agency_id uuid references public.agencies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_feature_flags_updated before update on public.feature_flags for each row execute function public.set_updated_at();

create table if not exists public.risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  snapshot_date date not null,
  risk_score int not null check (risk_score between 0 and 100),
  risk_level risk_level not null,
  miss_rate_7d numeric(5,2) not null default 0,
  miss_rate_30d numeric(5,2) not null default 0,
  avg_response_minutes_7d numeric(6,2) not null default 0,
  avg_response_minutes_30d numeric(6,2) not null default 0,
  late_response_rate_7d numeric(5,2) not null default 0,
  late_response_rate_30d numeric(5,2) not null default 0,
  retry_dependence_rate_7d numeric(5,2) not null default 0,
  medication_miss_rate_7d numeric(5,2) not null default 0,
  recovery_miss_rate_7d numeric(5,2) not null default 0,
  guardian_intervention_count_30d int not null default 0,
  recent_emergency_event_count_30d int not null default 0,
  score_factors jsonb not null default '{}'::jsonb,
  explanation text not null,
  trend_direction trend_direction not null default 'stable',
  threshold_crossed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (monitored_person_id, snapshot_date)
);
create index idx_risk_snapshots_level_date on public.risk_snapshots(risk_level, snapshot_date desc);
create trigger trg_risk_snapshots_updated before update on public.risk_snapshots for each row execute function public.set_updated_at();

create table if not exists public.risk_threshold_events (
  id uuid primary key default gen_random_uuid(),
  monitored_person_id uuid not null references public.monitored_people(id) on delete cascade,
  risk_snapshot_id uuid not null references public.risk_snapshots(id) on delete cascade,
  previous_level risk_level,
  new_level risk_level not null,
  crossed_at timestamptz not null default now(),
  notified boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_risk_threshold_events_crossed on public.risk_threshold_events(crossed_at desc);

alter table public.profiles enable row level security;
alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.monitored_people enable row level security;
alter table public.contacts enable row level security;
alter table public.guardian_network enable row level security;
alter table public.guardian_invites enable row level security;
alter table public.schedules enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_attempts enable row level security;
alter table public.checkin_responses enable row level security;
alter table public.escalations enable row level security;
alter table public.escalation_steps enable row level security;
alter table public.escalation_events enable row level security;
alter table public.notifications enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_resolutions enable row level security;
alter table public.health_notes enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.recovery_programs enable row level security;
alter table public.recovery_checkins enable row level security;
alter table public.emergency_events enable row level security;
alter table public.locations enable row level security;
alter table public.waitlist_users enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_events enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.message_templates enable row level security;
alter table public.communication_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.risk_snapshots enable row level security;
alter table public.risk_threshold_events enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.current_user_role() = 'platform_admin');
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.current_user_role() = 'platform_admin');

create policy agency_membership_read on public.agencies for select using (
  exists (select 1 from public.agency_members am where am.agency_id = agencies.id and am.profile_id = auth.uid())
  or public.current_user_role() = 'platform_admin'
);

create policy monitored_people_read on public.monitored_people for select using (
  profile_id = auth.uid()
  or exists (select 1 from public.guardian_network gn where gn.monitored_person_id = monitored_people.id and gn.guardian_profile_id = auth.uid() and gn.active)
  or exists (select 1 from public.agency_members am where am.agency_id = monitored_people.agency_id and am.profile_id = auth.uid())
  or public.current_user_role() = 'platform_admin'
);

create policy monitored_people_update_owner on public.monitored_people for update using (
  profile_id = auth.uid()
  or exists (select 1 from public.guardian_network gn where gn.monitored_person_id = monitored_people.id and gn.guardian_profile_id = auth.uid() and gn.permission_manage_schedules and gn.active)
  or public.current_user_role() in ('agency_admin','platform_admin')
);

create policy contacts_owner_rw on public.contacts for all using (
  owner_profile_id = auth.uid() or public.current_user_role() = 'platform_admin'
) with check (
  owner_profile_id = auth.uid() or public.current_user_role() = 'platform_admin'
);

create policy guardian_network_read on public.guardian_network for select using (
  guardian_profile_id = auth.uid()
  or exists (select 1 from public.monitored_people mp where mp.id = guardian_network.monitored_person_id and mp.profile_id = auth.uid())
  or public.current_user_role() = 'platform_admin'
);

create policy schedules_read on public.schedules for select using (
  exists (select 1 from public.monitored_people mp where mp.id = schedules.monitored_person_id and mp.profile_id = auth.uid())
  or exists (select 1 from public.guardian_network gn where gn.monitored_person_id = schedules.monitored_person_id and gn.guardian_profile_id = auth.uid() and gn.active)
  or public.current_user_role() in ('agency_staff','agency_admin','platform_admin')
);

create policy schedules_write on public.schedules for all using (
  exists (select 1 from public.monitored_people mp where mp.id = schedules.monitored_person_id and mp.profile_id = auth.uid())
  or exists (select 1 from public.guardian_network gn where gn.monitored_person_id = schedules.monitored_person_id and gn.guardian_profile_id = auth.uid() and gn.permission_manage_schedules and gn.active)
  or public.current_user_role() in ('agency_admin','platform_admin')
);

create policy read_monitored_scoped on public.checkins for select using (
  exists (select 1 from public.monitored_people mp where mp.id = checkins.monitored_person_id and (
    mp.profile_id = auth.uid()
    or exists (select 1 from public.guardian_network gn where gn.monitored_person_id = mp.id and gn.guardian_profile_id = auth.uid() and gn.active)
    or exists (select 1 from public.agency_members am where am.agency_id = mp.agency_id and am.profile_id = auth.uid())
  ))
  or public.current_user_role() = 'platform_admin'
);

create policy waitlist_public_insert on public.waitlist_users for insert with check (true);
create policy waitlist_self_read on public.waitlist_users for select using (
  profile_id = auth.uid() or email = (select email from public.profiles where id = auth.uid()) or public.current_user_role() = 'platform_admin'
);

create policy leaderboard_public_read on public.leaderboard_snapshots for select using (true);

create policy subscriptions_owner_read on public.subscriptions for select using (profile_id = auth.uid() or public.current_user_role() = 'platform_admin');
create policy notifications_owner_read on public.notifications for select using (profile_id = auth.uid() or public.current_user_role() = 'platform_admin');

create policy audit_platform_admin_only on public.audit_logs for select using (public.current_user_role() = 'platform_admin');

commit;

comment on table public.checkins is 'Persistent expected check-in occurrences generated from schedule rules.';
comment on column public.checkins.expected_at is 'Expected local check-in time converted to UTC for execution.';
comment on column public.escalation_steps.requires_ack is 'Delivery is not acknowledgment; explicit acknowledgment required when true.';
comment on column public.risk_snapshots.score_factors is 'Explainable weighted factors used to compute risk_score.';
comment on column public.risk_snapshots.explanation is 'Human-readable explanation for caregiver/agency visibility.';
