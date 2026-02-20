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
    setItinerary((prev) => [...prev, { ...stop, id: crypto.randomUUID() }])
  }, [])

  const removeStop = useCallback((stopId) => {
    setItinerary((prev) => prev.filter((stop) => stop.id !== stopId))
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
