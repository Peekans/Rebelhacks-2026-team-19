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
import { useAuth } from '../context/AuthContext'
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
    title: 'Build Itinerary',
    description:
      'Add events, restaurants, and attractions into your perfect day plan.',
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
    link: '#',
  },
]

export default function Home() {
  const { currentUser, logout } = useAuth()
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
              How would you like to start your adventure in Las Vegas today?
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