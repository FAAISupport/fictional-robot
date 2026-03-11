# Webhook Configuration

## Twilio

### SMS and Call Status Callback
Configure status callback URL to:

- `https://<app-domain>/api/webhooks/twilio/status`

Voice call webhook endpoint:

- `https://<app-domain>/api/webhooks/twilio/voice`

Inbound response endpoints used by TwiML:

- `POST /api/checkins/sms-response`
- `POST /api/checkins/voice-response?checkinId=<uuid>`

### Recommended Twilio Settings
- Enforce HTTPS only.
- Restrict webhook to production domain.
- Set retry behavior in Twilio Console.

## Stripe

### Endpoint
Configure one webhook endpoint in Stripe:

- `https://<app-domain>/api/webhooks/stripe`

### Required events
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted` (future handling)
- `checkout.session.completed` (optional analytics)

### Signature
Copy Stripe signing secret to:
- `STRIPE_WEBHOOK_SECRET`

## Validation and Logging
- Twilio callbacks are stored in `communication_logs`.
- Stripe events are stored in `billing_events`.
