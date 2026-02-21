/**
 * Anthropic Claude API helper
 *
 * Uses Claude claude-sonnet-4-6 for AI chatbot features such as
 * itinerary suggestions, venue recommendations, and trip planning assistance.
 *
 * =========================================================================
 * API KEY SETUP:
 * 1. Get an API key from https://console.anthropic.com/
 * 2. Add it to your .env file as: VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
 *
 * IMPORTANT - PRODUCTION NOTE:
 * This code calls the Anthropic API directly from the browser. This works
 * for development/hackathon purposes, but in production you should:
 * 1. Create a backend endpoint (e.g., /api/chat) on your server
 * 2. Move the API key to a server-side environment variable
 * 3. Proxy requests through your backend to avoid exposing the key
 *
 * Example backend flow:
 *   Browser -> Your Backend (/api/chat) -> Anthropic API -> Your Backend -> Browser
 * =========================================================================
 */
import express from 'express'

const app = express();
app.use(express.json());

/**
 * Check if the Anthropic API key is configured.
 * @returns {boolean} True if the API key is set
 */
export function isApiKeyConfigured() {
  return Boolean(ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.trim().length > 0)
}

/**
 * Send a message to Claude and get a response.
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} Claude's response text
 */
export async function chatWithClaude(userMessage, conversationHistory = []) {
  // Check if API key is configured before making the request
  if (!isApiKeyConfigured()) {
    throw new Error(
      'ANTHROPIC_API_KEY_MISSING: Please add your Anthropic API key to the .env file as VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx. ' +
      'Get a key at https://console.anthropic.com/'
    )
  }

  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  let response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
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
          'You are a helpful Las Vegas travel assistant named Viva. Help users plan their trips, suggest venues, restaurants, shows, and activities in Las Vegas. Be enthusiastic but concise. Use your knowledge of Las Vegas to give specific, actionable recommendations. If asked about events, mention that users can check the Browse Events section for live Ticketmaster listings.',
        messages,
      }),
    })
  } catch (err) {
    throw new Error(
      'NETWORK_ERROR: Could not reach the Anthropic API. Check your internet connection and try again.'
    )
  }

  if (!response.ok) {
    const status = response.status
    if (status === 401) {
      throw new Error(
        'INVALID_API_KEY: Your Anthropic API key is invalid or expired. Please check your .env file and update VITE_ANTHROPIC_API_KEY.'
      )
    }
    if (status === 429) {
      throw new Error(
        'RATE_LIMITED: Too many requests. Please wait a moment and try again.'
      )
    }
    throw new Error(`API_ERROR: Anthropic API returned status ${status}. Please try again.`)
  }

  if (!response.ok) {
    const status = response.status
    if (status === 401) {
      throw new Error(
        'INVALID_API_KEY: Your Anthropic API key is invalid or expired. Please check your .env file and update VITE_ANTHROPIC_API_KEY.'
      )
    }
    if (status === 429) {
      throw new Error(
        'RATE_LIMITED: Too many requests. Please wait a moment and try again.'
      )
    }
    throw new Error(`API_ERROR: Anthropic API returned status ${status}. Please try again.`)
  }

  const data = await response.json();
  res.json({ text: data.content[0].text });
};

app.listen(3000, () => console.log('Server running on port 3000'));