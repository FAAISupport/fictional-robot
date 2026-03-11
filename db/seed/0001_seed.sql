begin;

insert into public.message_templates (template_key, channel, body)
values
('checkin_sms_default', 'sms', 'Hi {{name}}, this is your LifeSignal check-in. Reply YES if you are okay.'),
('checkin_voice_default', 'voice', 'Hello {{name}}. This is your LifeSignal safety check-in. Press 1 to confirm you are okay.'),
('escalation_sms_default', 'sms', 'LifeSignal alert: {{name}} missed a check-in. Please acknowledge: {{ack_link}}'),
('medication_reminder_default', 'sms', 'Medication reminder for {{name}}. Reply TAKEN when complete.')
on conflict (template_key) do nothing;

insert into public.feature_flags (flag_key, description, enabled)
values
('emergency_mode', 'Enable emergency SOS and routing', true),
('medication_module', 'Enable medication reminders and adherence tracking', true),
('recovery_module', 'Enable recovery check-in workflows', true),
('waitlist_leaderboards', 'Enable public waitlist leaderboard views', true)
on conflict (flag_key) do nothing;

commit;
