/**
 * Landing Page
 *
 * Marketing/hero page for Viva Las Ventures.
 * Includes: hero section with CTA, feature highlights,
 * how-it-works steps, and a final call-to-action.
 */

import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: 'AI Trip Planner',
    description:
      'Chat with our AI concierge powered by Claude to get personalized restaurant picks, show recommendations, and hidden gems only locals know.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    title: 'Live Events Feed',
    description:
      'Browse real-time shows, concerts, sports, and nightlife pulled straight from Ticketmaster. Never miss what\'s happening on the Strip.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v3m0 12v3M15.75 3v3m0 12v3" />
      </svg>
    ),
    title: 'Drag & Drop Itinerary',
    description:
      'Build your perfect day by dragging events, restaurants, and attractions into a timeline. Reorder on the fly — your trip, your rules.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: 'For Locals & Tourists',
    description:
      'Whether you\'re visiting for the weekend or you\'ve lived here for years, discover new spots and plan like a pro.',
  },
]

const STEPS = [
  { number: '01', title: 'Sign Up', description: 'Create a free account in seconds with email or Google.' },
  { number: '02', title: 'Browse Events', description: 'Explore live shows, dining, and nightlife happening now.' },
  { number: '03', title: 'Build Your Itinerary', description: 'Drag and drop your picks into a custom day plan.' },
  { number: '04', title: 'Go Have Fun', description: 'Hit the Strip with your perfect itinerary in your pocket.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-heading text-lg text-white tracking-wide">
              Viva Las Ventures
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-accent/80 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="text-sm bg-primary text-background font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large gradient orb */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-glow/5 rounded-full blur-[120px]" />
          {/* Smaller accent orb */}
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          {/* Decorative sparkle dots */}
          <div className="absolute top-32 left-[15%] w-1.5 h-1.5 bg-cyan-glow rounded-full animate-pulse-glow" />
          <div className="absolute top-48 right-[20%] w-1 h-1 bg-primary rounded-full animate-pulse-glow animation-delay-400" />
          <div className="absolute bottom-40 left-[25%] w-1 h-1 bg-cyan-glow rounded-full animate-pulse-glow animation-delay-800" />
          <div className="absolute top-64 left-[60%] w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow animation-delay-200" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Logo mark */}
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <Logo size={100} className="animate-float" />
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-in-up animation-delay-200">
            <span className="block text-6xl sm:text-7xl lg:text-8xl font-heading font-bold text-white tracking-tight leading-none">
              VIVA LAS
            </span>
            <span className="block text-6xl sm:text-7xl lg:text-8xl font-heading font-bold text-white tracking-tight leading-none mt-2">
              VENTURES
            </span>
          </h1>

          {/* Decorative line with sparkles — matches the branding */}
          <div className="flex items-center justify-center gap-3 my-6 animate-fade-in-up animation-delay-400">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-glow" />
            <svg className="w-4 h-4 text-cyan-glow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
            </svg>
            <div className="h-px w-24 bg-cyan-glow" />
            <svg className="w-4 h-4 text-cyan-glow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-glow" />
          </div>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-accent/90 font-body max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-600">
            Your AI-powered Las Vegas itinerary planner. Discover live events,
            build drag-and-drop day plans, and experience Vegas like never before.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-800">
            <Link
              to="/login"
              className="bg-primary text-background font-semibold px-8 py-3.5 rounded-full text-base hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              Start Planning — It's Free
            </Link>
            <a
              href="#features"
              className="border border-white/20 text-white font-medium px-8 py-3.5 rounded-full text-base hover:bg-white/5 hover:border-white/40 transition-all"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-cyan-glow text-sm font-semibold uppercase tracking-widest mb-3">
              Everything you need
            </p>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white">
              Plan Vegas Your Way
            </h2>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative bg-surface/60 border border-white/5 rounded-2xl p-8 hover:border-cyan-glow/30 hover:bg-surface transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-cyan-glow/10 text-cyan-glow flex items-center justify-center mb-5 group-hover:bg-cyan-glow/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 font-body leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-32 px-6">
        {/* Divider gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">
              Simple as 1-2-3-4
            </p>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white">
              How It Works
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-5xl font-heading font-bold text-cyan-glow/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-heading font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-white/50 text-sm font-body leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-3xl mx-auto text-center">
          {/* Decorative glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-6">
              Ready to Hit the Strip?
            </h2>
            <p className="text-white/60 text-lg font-body mb-10 max-w-xl mx-auto">
              Join Viva Las Ventures and start building your dream Vegas itinerary today.
              AI-powered. Event-driven. Completely free.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary text-background font-semibold px-10 py-4 rounded-full text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-10 px-6">
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
