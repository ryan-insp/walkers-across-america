export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') ?? ''

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!location) {
    return Response.json({ fact: '', debug: 'no location' })
  }
  if (!apiKey) {
    return Response.json({ fact: '', debug: 'no api key' })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: `Give me one short, playful, surprising fun fact about ${location}. 1-2 sentences max. Be specific and concrete — a real detail, not a generic observation. Conversational tone, a little unexpected. Don't start with "Did you know".`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return Response.json({ fact: '', debug: `anthropic ${res.status}: ${body}` })
    }

    const data = await res.json()
    const fact = (data.content?.[0]?.text as string) ?? ''

    return Response.json({ fact, debug: 'ok' }, {
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      },
    })
  } catch (err) {
    return Response.json({ fact: '', debug: `exception: ${err}` })
  }
}
