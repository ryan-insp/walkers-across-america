import { unstable_cache } from 'next/cache'

async function generateFunFact(locationAndDate: string): Promise<string> {
  // Strip the date suffix we append for cache-keying purposes
  const location = locationAndDate.split('||')[0]

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return ''

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
            content: `Give me one short, playful, surprising fun fact about ${location}. \
1-2 sentences max. Be specific and concrete — a real detail, not a generic observation. \
Conversational tone, a little unexpected. Don't start with "Did you know".`,
          },
        ],
      }),
      cache: 'no-store',
    })

    if (!res.ok) return ''
    const data = await res.json()
    return (data.content?.[0]?.text as string) ?? ''
  } catch {
    return ''
  }
}

// Cache keyed by location + calendar date → refreshes daily and on location change
const getCachedFunFact = unstable_cache(generateFunFact, ['fun-fact'], {
  revalidate: 86400, // 24 hours
})

export async function getFunFact(locationName: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return getCachedFunFact(`${locationName}||${today}`)
}
