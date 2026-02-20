/**
 * Home Page
 *
 * Main dashboard after login. Will display:
 * - Live events feed from Ticketmaster API
 * - Quick-add buttons to add events to itinerary
 * - Itinerary summary sidebar
 * - AI chatbot for trip suggestions
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-heading text-primary mb-4">Home</h1>
      <p className="text-accent font-body">
        Events and itinerary builder will appear here.
      </p>
    </div>
  )
}
