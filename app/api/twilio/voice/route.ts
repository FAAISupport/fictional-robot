function xml(body: string) {
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const checkinId = url.searchParams.get("checkinId");

  if (!checkinId) {
    return xml("<Response><Say>Missing check in reference.</Say></Response>");
  }

  return xml(
    `<Response>
      <Gather numDigits="1" action="/api/checkins/voice-response?checkinId=${checkinId}" method="POST">
        <Say>This is LifeSignal. Press 1 if you are safe. Press 9 for help.</Say>
      </Gather>
      <Say>No selection received. We will follow up by text message.</Say>
    </Response>`
  );
}
