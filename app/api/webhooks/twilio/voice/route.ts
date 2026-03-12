function xml(body: string) {
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const checkinId = url.searchParams.get("checkinId");

  if (!checkinId) {
    return xml("<Response><Say>Invalid check in request.</Say></Response>");
  }

  return xml(
    `<Response>
      <Gather numDigits="1" action="/api/checkins/voice-response?checkinId=${checkinId}" method="POST">
        <Say>This is your LifeSignal safety check in. Please press 1 to confirm you are okay.</Say>
      </Gather>
      <Say>We did not receive input. Goodbye.</Say>
    </Response>`
  );
}
