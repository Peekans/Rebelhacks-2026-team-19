/**
 * Anthropic Claude API helper
 *
 * Uses Claude claude-sonnet-4-6 for AI chatbot features such as
 * itinerary suggestions, venue recommendations, and trip planning assistance.
 *
 * NOTE: In production, API calls to Anthropic should be routed through
 * a backend server to avoid exposing the API key in the browser.
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-6'

/**
 * Send a message to Claude and get a response.
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} Claude's response text
 */
export async function chatWithClaude(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system:
        'You are a helpful Las Vegas travel assistant. Help users plan their trips, suggest venues, restaurants, shows, and activities in Las Vegas.',
      messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}