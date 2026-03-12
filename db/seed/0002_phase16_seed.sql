begin;

-- Demo waitlist cohort for Phase 16 testing
insert into public.waitlist_users (
  id, name, email, phone, relationship_type, city, state, referral_code,
  referral_count, spots_gained, beta_eligibility, joined_at
)
values
  ('11111111-1111-1111-1111-111111111111', 'Avery Stone', 'avery@example.com', '+15550000001', 'caregiver', 'Tampa', 'FL', 'avery1111', 6, 30, 'early_beta', now() - interval '14 days'),
  ('22222222-2222-2222-2222-222222222222', 'Jordan Lee', 'jordan@example.com', '+15550000002', 'self', 'Orlando', 'FL', 'jordan2222', 2, 10, 'standard', now() - interval '10 days'),
  ('33333333-3333-3333-3333-333333333333', 'Morgan Diaz', 'morgan@example.com', '+15550000003', 'facility', 'The Villages', 'FL', 'morgan3333', 12, 60, 'guaranteed_beta', now() - interval '7 days')
on conflict (id) do update set
  referral_count = excluded.referral_count,
  spots_gained = excluded.spots_gained,
  beta_eligibility = excluded.beta_eligibility,
  updated_at = now();

insert into public.referrals (
  id, referrer_waitlist_user_id, referred_waitlist_user_id, referral_code, status
)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'avery1111', 'qualified')
on conflict (referrer_waitlist_user_id, referred_waitlist_user_id) do nothing;

insert into public.leaderboard_snapshots (
  id, snapshot_type, region_key, waitlist_user_id, rank, referral_count, score, snapshot_date
)
values
  ('55555555-5555-5555-5555-555555555555', 'all_time', null, '33333333-3333-3333-3333-333333333333', 1, 12, 180, current_date),
  ('66666666-6666-6666-6666-666666666666', 'all_time', null, '11111111-1111-1111-1111-111111111111', 2, 6, 90, current_date),
  ('77777777-7777-7777-7777-777777777777', 'all_time', null, '22222222-2222-2222-2222-222222222222', 3, 2, 30, current_date)
on conflict (snapshot_type, region_key_normalized, waitlist_user_id, snapshot_date) do update set
  rank = excluded.rank,
  referral_count = excluded.referral_count,
  score = excluded.score;

insert into public.analytics_events (event_name, event_category, event_payload, occurred_at)
values
  ('platform.seed.phase16', 'seed', '{"source":"db/seed/0002_phase16_seed.sql"}'::jsonb, now())
on conflict do nothing;

commit;
