/**
 * Landing Page
 *
 * Marketing/hero page for Viva Las Ventures.
 * Will include: hero section with CTA, feature highlights,
 * testimonials, and a call-to-action to sign up or explore.
 */

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-heading text-primary mb-4">
          Viva Las Ventures
        </h1>
        <p className="text-accent text-lg font-body">
          Your Las Vegas itinerary planner for locals and tourists
        </p>
      </div>
    </div>
  )
}
