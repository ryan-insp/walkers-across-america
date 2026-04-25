/**
 * Fetches a playful fun fact about the current location from Claude.
 * Called server-side; the page's ISR revalidation (every 5 min) naturally
 * limits how often this runs. Claude Haiku costs fractions of a cent per call.
 */
export async function getFunFact(locationName: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[FunFact] ANTHROPIC_API_KEY is not set')
    return ''
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
            content: `Give me one short, playful, surprising fun fact about ${locationName}. \
1-2 sentences max. Be specific and concrete — a real detail, not a generic observation. \
Conversational tone, a little unexpected. Don't start with "Did you know".`,
          },
        ],
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[FunFact] Anthropic API error ${res.status}: ${body}`)
      return ''
    }

    const data = await res.json()
    const text = (data.content?.[0]?.text as string) ?? ''
    return text
  } catch (err) {
    console.error('[FunFact] Fetch failed:', err)
    return ''
  }
}
