/**
 * Builder Page
 *
 * Dedicated itinerary building screen.
 * Contains:
 * - Your Itinerary (scrollable)
 * - Upcoming Events (Ticketmaster fetch + images + add/remove + load more)
 */

import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useItinerary } from '../context/ItineraryContext'
import Logo from '../components/logo'

function getUserDisplayName(user) {
  if (!user) return 'Guest'
  if (user.displayName) return user.displayName
  if (user.email) return user.email.split('@')[0]
  return 'Guest'
}

function pickBestImage(images) {
  if (!Array.isArray(images) || images.length === 0) return ''
  const preferred = images
    .filter((img) => (img.width ?? 0) >= 200)
    .sort((a, b) => (a.width ?? 9999) - (b.width ?? 9999))
  return (preferred[0] || images[0])?.url || ''
}

function normalizeTicketmasterEvent(e) {
  const venue =
    e?._embedded?.venues?.[0]?.name ||
    e?._embedded?.venues?.[0]?.address?.line1 ||
    'Unknown venue'

  const localDate = e?.dates?.start?.localDate || ''
  const localTime = e?.dates?.start?.localTime || ''
  const date = [localDate, localTime].filter(Boolean).join(' ') || 'Time TBD'

  return {
    id: e.id,
    name: e.name || 'Untitled Event',
    venue,
    date,
    imageUrl: pickBestImage(e.images),
    category: e?.classifications?.[0]?.segment?.name || 'Event',
  }
}

function toIsoNoMs(d) {
  return new Date(d.getTime() - d.getMilliseconds()).toISOString().replace('.000', '')
}

const SAMPLE_EVENTS = [
  {
    id: 'sample-1',
    name: 'Cirque du Soleil: "O"',
    venue: 'Bellagio Hotel & Casino',
    date: 'Tonight, 7:00 PM',
    category: 'Show',
    imageUrl: '',
  },
  {
    id: 'sample-2',
    name: 'Bruno Mars Concert',
    venue: 'Park MGM',
    date: 'Tomorrow, 9:00 PM',
    category: 'Concert',
    imageUrl: '',
  },
  {
    id: 'sample-3',
    name: 'Raiders vs. Chiefs',
    venue: 'Allegiant Stadium',
    date: 'Sat, 5:30 PM',
    category: 'Sports',
    imageUrl: '',
  },
]

export default function Builder() {
  const { currentUser, logout } = useAuth()
  const displayName = getUserDisplayName(currentUser)

  const { itinerary, addStop, removeStop } = useItinerary()

  const [upcomingEvents, setUpcomingEvents] = useState(SAMPLE_EVENTS)
  const [page, setPage] = useState(0)
  const [loadingEvents, setLoadingEvents] = useState(false)

  const itineraryIds = useMemo(() => new Set(itinerary.map((s) => String(s.id))), [itinerary])

  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TICKETMASTER_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_TICKETMASTER_KEY) ||
    ''

  useEffect(() => {
    let cancelled = false

    async function fetchEvents() {
      if (!apiKey) return
      setLoadingEvents(true)

      const startDateTime = toIsoNoMs(new Date())

      const url =
        `https://app.ticketmaster.com/discovery/v2/events.json` +
        `?apikey=${encodeURIComponent(apiKey)}` +
        `&city=Las%20Vegas` +
        `&sort=date,asc` +
        `&startDateTime=${encodeURIComponent(startDateTime)}` +
        `&locale=*` +
        `&size=20` +
        `&page=${page}`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Ticketmaster error ${res.status}`)
        const data = await res.json()

        const raw = data?._embedded?.events ?? []
        const normalized = raw.map(normalizeTicketmasterEvent)

        if (!cancelled) {
          if (normalized.length === 0 && page === 0) {
            setUpcomingEvents(SAMPLE_EVENTS)
          } else {
            setUpcomingEvents((prev) => (page === 0 ? normalized : [...prev, ...normalized]))
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoadingEvents(false)
      }
    }

    fetchEvents()
    return () => {
      cancelled = true
    }
  }, [apiKey, page])

  const getCategoryIcon = (category) => {
    const c = (category || '').toLowerCase()
    if (c.includes('music') || c.includes('concert')) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
        </svg>
      )
    }
    if (c.includes('sport')) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3.75 3.75 0 0 0-3.75 3.75 7.5 7.5 0 0 0 3.75 6.497 7.5 7.5 0 0 0 3.75-6.497A3.75 3.75 0 0 0 12 3.75Z" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-heading text-lg text-white tracking-wide">
              Viva Las Ventures
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-accent/80 font-body hidden sm:block">
                {displayName}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-white/40 hover:text-white transition-colors font-body"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MAIN ===== */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">
                Build Itinerary
              </h1>
              <p className="text-white/50 font-body mt-2">
                Add events from the right panel to your itinerary on the left.
              </p>
            </div>
            <Link
              to="/home"
              className="text-sm text-cyan-glow hover:text-cyan-glow/80 transition-colors font-body"
            >
              Back to Home
            </Link>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Itinerary */}
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-semibold text-white">
                  Your Itinerary
                </h2>
              </div>

              {itinerary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40 font-body text-sm">
                    No stops added yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {itinerary.map((stop, i) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-4 bg-white/5 rounded-xl p-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold font-body shrink-0">
                        {i + 1}
                      </div>

                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        {stop.imageUrl ? (
                          <img
                            src={stop.imageUrl}
                            alt={stop.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body text-white truncate">
                          {stop.name}
                        </p>
                        {stop.venue && (
                          <p className="text-xs text-white/40 font-body truncate">
                            {stop.venue}
                          </p>
                        )}
                        {stop.date && (
                          <p className="text-xs text-primary/80 font-body truncate">
                            {stop.date}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStop?.(stop.id)}
                        className="w-9 h-9 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/15 hover:text-red-300 transition-colors shrink-0 flex items-center justify-center"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-semibold text-white">
                  Upcoming Events
                </h2>

                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="text-sm text-cyan-glow hover:text-cyan-glow/80 transition-colors font-body"
                >
                  Load More
                </button>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {upcomingEvents.map((event) => {
                  const alreadyAdded = itineraryIds.has(String(event.id))

                  return (
                    <div
                      key={event.id}
                      className="group flex items-center gap-4 bg-white/5 rounded-xl p-4 hover:bg-white/8 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 text-cyan-glow flex items-center justify-center shrink-0">
                        {getCategoryIcon(event.category)}
                      </div>

                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body text-white font-medium truncate">
                          {event.name}
                        </p>
                        <p className="text-xs text-white/40 font-body truncate">
                          {event.venue}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-primary font-body font-medium whitespace-nowrap">
                          {event.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (alreadyAdded) removeStop?.(event.id)
                          else addStop?.(event)
                        }}
                        className="w-9 h-9 rounded-lg bg-white/5 text-white/40 hover:bg-primary/20 hover:text-primary transition-colors shrink-0 flex items-center justify-center"
                        title={alreadyAdded ? 'Remove from itinerary' : 'Add to itinerary'}
                      >
                        {alreadyAdded ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}

                {loadingEvents && (
                  <p className="text-xs text-white/30 font-body pt-2 text-center">
                    Loading more…
                  </p>
                )}
              </div>

              {!apiKey && (
                <p className="text-xs text-white/30 font-body pt-3 text-center">
                  Add VITE_TICKETMASTER_KEY to your .env to load real events.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}