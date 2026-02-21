import { createContext, useContext, useState, useCallback } from 'react'

const ItineraryContext = createContext(null)

export function useItinerary() {
  const context = useContext(ItineraryContext)
  if (!context) {
    throw new Error('useItinerary must be used within an ItineraryProvider')
  }
  return context
}

export function ItineraryProvider({ children }) {
  const [itinerary, setItinerary] = useState([])

  const addStop = useCallback((stop) => {
    setItinerary((prev) => {
      // If stop has an id (Ticketmaster, your SAMPLE_EVENTS), keep it.
      // Otherwise generate one for custom stops.
      const stopId = stop?.id != null ? String(stop.id) : crypto.randomUUID()

      // Prevent duplicates by id
      const exists = prev.some((s) => String(s.id) === String(stopId))
      if (exists) return prev

      return [...prev, { ...stop, id: stopId }]
    })
  }, [])

  const removeStop = useCallback((stopId) => {
    setItinerary((prev) => prev.filter((stop) => String(stop.id) !== String(stopId)))
  }, [])

  const reorderStops = useCallback((reorderedItinerary) => {
    setItinerary(reorderedItinerary)
  }, [])

  const clearItinerary = useCallback(() => {
    setItinerary([])
  }, [])

  const value = {
    itinerary,
    addStop,
    removeStop,
    reorderStops,
    clearItinerary,
  }

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  )
}