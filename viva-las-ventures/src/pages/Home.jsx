/**
 * Home Page
 *
 * Main dashboard after login. Displays:
 * - Navbar with logo and user name
 * - Greeting with time-of-day awareness
 * - Quick-action cards (Browse Events, Build Itinerary, AI Concierge)
 *
 * NOTE: The itinerary + upcoming events panels were moved into /builder.
 */

import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/logo'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getUserDisplayName(user) {
  if (!user) return 'Guest'
  if (user.displayName) return user.displayName
  if (user.email) return user.email.split('@')[0]
  return 'Guest'
}

function pickBestImage(images) {
  if (!Array.isArray(images) || images.length === 0) return ''
  // Prefer a "not tiny" image if possible
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

// Ticketmaster-friendly ISO without milliseconds: 2026-02-20T19:02:11Z
function toIsoNoMs(d) {
  return new Date(d.getTime() - d.getMilliseconds()).toISOString().replace('.000', '')
}

const ACTION_CARDS = [
  {
    title: 'Build Itinerary',
    description:
      'Drag and drop events, restaurants, and attractions into your perfect day plan.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    link: '/builder', // ✅ moved panels into Builder
  },
  {
    title: 'AI Concierge',
    description:
      'Chat with our AI assistant for personalized Vegas recommendations and tips.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    link: '/concierge',
  },
]

export default function Home() {
  const { currentUser, logout } = useAuth()
  const greeting = getGreeting()
  const displayName = getUserDisplayName(currentUser)

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

      // Use ISO without milliseconds for Ticketmaster
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

        // If Ticketmaster returns nothing, don't wipe the UI to empty
        if (!cancelled) {
          if (normalized.length === 0 && page === 0) {
            setUpcomingEvents(SAMPLE_EVENTS)
          } else {
            setUpcomingEvents((prev) => (page === 0 ? normalized : [...prev, ...normalized]))
          }
        }
      } catch (e) {
        console.error(e)
        // On error, keep whatever is currently showing (don’t "break" UI)
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

      {/* ===== MAIN CONTENT ===== */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* ===== GREETING ===== */}
          <section className="mb-12 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-3">
              {greeting},{' '}
              <span className="text-primary">{displayName}</span>
            </h1>
            <p className="text-lg text-white/50 font-body">
              What would you like to do today?
            </p>
          </section>

          {/* ===== ACTION CARDS ===== */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">            {ACTION_CARDS.map((card, i) => (
              <Link
                key={card.title}
                to={card.link}
                className={`group relative bg-surface/60 border border-white/5 rounded-2xl p-8 hover:border-cyan-glow/30 hover:bg-surface transition-all duration-300 animate-fade-in-up animation-delay-${(i + 1) * 200}`}
              >
                <div className="w-14 h-14 rounded-xl bg-cyan-glow/10 text-cyan-glow flex items-center justify-center mb-5 group-hover:bg-cyan-glow/20 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-white/60 font-body leading-relaxed text-sm">
                  {card.description}
                </p>
                <div className="absolute top-8 right-8 text-white/20 group-hover:text-cyan-glow transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </main>


      {/* ===== CALENDAR ==== */}
      

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <span className="text-sm text-white/40 font-body">
              Viva Las Ventures
            </span>
          </div>
          <p className="text-xs text-white/30 font-body">
            Built with React, Firebase, Tailwind CSS &amp; Claude AI
          </p>
        </div>
      </footer>
    </div>
  )
}