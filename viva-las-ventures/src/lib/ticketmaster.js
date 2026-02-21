/**
 * Ticketmaster Discovery API helper
 *
 * Fetches live events, shows, concerts, and attractions in Las Vegas
 * using the Ticketmaster Discovery API v2.
 */

const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'

/**
 * Search for events in Las Vegas.
 * @param {Object} params - Search parameters
 * @param {string} [params.keyword] - Search keyword
 * @param {string} [params.startDateTime] - ISO 8601 start date
 * @param {string} [params.endDateTime] - ISO 8601 end date
 * @param {string} [params.classificationName] - Event category (e.g. "music", "sports")
 * @param {number} [params.size=20] - Number of results
 * @returns {Promise<Object>} Ticketmaster API response
 */
export async function searchEvents({
  keyword = '',
  startDateTime,
  endDateTime,
  classificationName,
  size = 20,
} = {}) {
  const params = new URLSearchParams({
    apikey: API_KEY,
    city: 'Las Vegas',
    stateCode: 'NV',
    size: String(size),
  })

  if (keyword) params.set('keyword', keyword)
  if (startDateTime) params.set('startDateTime', startDateTime)
  if (endDateTime) params.set('endDateTime', endDateTime)
  if (classificationName) params.set('classificationName', classificationName)

  const response = await fetch(`${BASE_URL}/events.json?${params}`)

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get details for a specific event by ID.
 * @param {string} eventId - The Ticketmaster event ID
 * @returns {Promise<Object>} Event details
 */
export async function getEventById(eventId) {
  const response = await fetch(
    `${BASE_URL}/events/${eventId}.json?apikey=${API_KEY}`
  )

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Search for venues in Las Vegas.
 * @param {string} keyword - Venue search keyword
 * @param {number} [size=10] - Number of results
 * @returns {Promise<Object>} Ticketmaster API response
 */
export async function searchVenues(keyword = '', size = 10) {
  const params = new URLSearchParams({
    apikey: API_KEY,
    city: 'Las Vegas',
    stateCode: 'NV',
    size: String(size),
  })

  if (keyword) params.set('keyword', keyword)

  const response = await fetch(`${BASE_URL}/venues.json?${params}`)

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status}`)
  }

  return response.json()
}