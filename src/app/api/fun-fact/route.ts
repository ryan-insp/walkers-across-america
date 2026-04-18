import { unstable_cache } from 'next/cache'

async function fetchFact(locationAndDate: string): Promise<string> {
  const location = locationAndDate.split('||')[0]
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return ''

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
  })

  if (!res.ok) return ''
  const data = await res.json()
  return (data.content?.[0]?.text as string) ?? ''
}

const getCachedFact = unstable_cache(fetchFact, ['fun-fact'], { revalidate: 86400 })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') ?? ''
  const date = new Date().toISOString().split('T')[0]

  const fact = await getCachedFact(`${location}||${date}`)
  return Response.json({ fact })
}
