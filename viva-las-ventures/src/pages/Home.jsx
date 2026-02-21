/**
 * Home Page
 *
 * Main dashboard after login. Displays:
 * - Navbar with logo and user name
 * - Greeting with time-of-day awareness
 * - Quick-action cards (Browse Events, Build Itinerary, AI Concierge)
 * - Itinerary summary panel ("Your Itinerary")
 * - Upcoming events panel
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useItinerary } from '../context/ItineraryContext'
import Logo from '../components/Logo'

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

const ACTION_CARDS = [
  {
    title: 'Browse Events',
    description:
      'Explore live shows, concerts, sports, and nightlife happening across Las Vegas.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    link: '/builder',
  },
  {
    title: 'Build Itinerary',
    description:
      'Drag and drop events, restaurants, and attractions into your perfect day plan.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
      </svg>
    ),
    link: '/builder',
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

const SAMPLE_EVENTS = [
  {
    id: 1,
    name: 'Cirque du Soleil: "O"',
    venue: 'Bellagio Hotel & Casino',
    date: 'Tonight, 7:00 PM',
    category: 'Show',
  },
  {
    id: 2,
    name: 'Bruno Mars Concert',
    venue: 'Park MGM',
    date: 'Tomorrow, 9:00 PM',
    category: 'Concert',
  },
  {
    id: 3,
    name: 'Raiders vs. Chiefs',
    venue: 'Allegiant Stadium',
    date: 'Sat, 5:30 PM',
    category: 'Sports',
  },
]

export default function Home() {
  const { currentUser, logout } = useAuth()
  const { itinerary, removeStop } = useItinerary()
  const greeting = getGreeting()
  const displayName = getUserDisplayName(currentUser)

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
            {/* User avatar + name */}
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
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {ACTION_CARDS.map((card, i) => (
              <Link
                key={card.title}
                to={card.link}
                className={`group relative bg-surface/60 border border-white/5 rounded-2xl p-8 hover:border-cyan-glow/30 hover:bg-surface transition-all duration-300 animate-fade-in-up animation-delay-${(i + 1) * 200}`}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-cyan-glow/10 text-cyan-glow flex items-center justify-center mb-5 group-hover:bg-cyan-glow/20 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-white/60 font-body leading-relaxed text-sm">
                  {card.description}
                </p>
                {/* Arrow indicator */}
                <div className="absolute top-8 right-8 text-white/20 group-hover:text-cyan-glow transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              </Link>
            ))}
          </section>

          {/* ===== BOTTOM PANELS ===== */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Your Itinerary */}
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8 animate-fade-in-up animation-delay-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-semibold text-white">
                  Your Itinerary
                </h2>
                {itinerary.length > 0 && (
                  <Link
                    to="/builder"
                    className="text-sm text-cyan-glow hover:text-cyan-glow/80 transition-colors font-body"
                  >
                    Edit
                  </Link>
                )}
              </div>

              {itinerary.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <p className="text-white/40 font-body text-sm mb-4">
                    No stops added yet
                  </p>
                  <Link
                    to="/builder"
                    className="text-sm bg-primary/10 text-primary font-medium px-5 py-2 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    Start Building
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {itinerary.slice(0, 4).map((stop, i) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-4 bg-white/5 rounded-xl p-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold font-body">
                        {i + 1}
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
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeStop(stop.id)}
                        className="w-7 h-7 rounded-lg bg-white/5 text-white/20 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
                        title="Remove stop"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {itinerary.length > 4 && (
                    <Link
                      to="/builder"
                      className="block text-xs text-cyan-glow/60 hover:text-cyan-glow text-center font-body pt-2 transition-colors"
                    >
                      +{itinerary.length - 4} more stops — View All
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8 animate-fade-in-up animation-delay-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-semibold text-white">
                  Upcoming Events
                </h2>
                <Link
                  to="/builder"
                  className="text-sm text-cyan-glow hover:text-cyan-glow/80 transition-colors font-body"
                >
                  See More
                </Link>
              </div>

              <div className="space-y-3">
                {SAMPLE_EVENTS.map((event) => (
                  <div
                    key={event.id}
                    className="group flex items-center gap-4 bg-white/5 rounded-xl p-4 hover:bg-white/8 transition-colors cursor-pointer"
                  >
                    {/* Category badge */}
                    <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 text-cyan-glow flex items-center justify-center shrink-0">
                      {event.category === 'Show' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                        </svg>
                      )}
                      {event.category === 'Concert' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                        </svg>
                      )}
                      {event.category === 'Sports' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 3.75a3.75 3.75 0 0 0-3.75 3.75 7.5 7.5 0 0 0 3.75 6.497 7.5 7.5 0 0 0 3.75-6.497A3.75 3.75 0 0 0 12 3.75Z" />
                        </svg>
                      )}
                    </div>
                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-white font-medium truncate">
                        {event.name}
                      </p>
                      <p className="text-xs text-white/40 font-body truncate">
                        {event.venue}
                      </p>
                    </div>
                    {/* Date */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-primary font-body font-medium">
                        {event.date}
                      </p>
                    </div>
                    {/* Arrow to builder */}
                    <Link
                      to="/builder"
                      className="w-8 h-8 rounded-lg bg-white/5 text-white/30 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors shrink-0"
                      title="Add to itinerary"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      </main>

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
