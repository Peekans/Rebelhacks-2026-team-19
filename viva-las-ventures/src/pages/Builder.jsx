/**
 * Builder Page
 *
 * Standalone itinerary builder with drag-and-drop reordering.
 * Will include:
 * - Drag-and-drop list of itinerary stops (@dnd-kit)
 * - Add/remove/edit stops
 * - Map or timeline view of the day's plan
 * - Export or share itinerary
 */

export default function Builder() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-heading text-primary mb-4">
        Itinerary Builder
      </h1>
      <p className="text-accent font-body">
        Drag-and-drop itinerary builder will appear here.
      </p>
    </div>
  )
}
