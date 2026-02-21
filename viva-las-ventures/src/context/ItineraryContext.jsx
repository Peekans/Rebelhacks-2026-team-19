/**
 * Itinerary Context
 *
 * Manages the user's current itinerary (list of stops/events) in memory.
 * Provides add, remove, reorder, and clear operations.
 *
 * =========================================================================
 * DATABASE PERSISTENCE (TODO):
 * This context currently stores the itinerary in React state (in-memory).
 * When the page refreshes, the itinerary is lost. To persist it, you need
 * to integrate with a database.
 *
 * Option A — Firebase Firestore:
 *   1. Import Firestore functions:
 *      import { doc, setDoc, onSnapshot } from 'firebase/firestore'
 *      import { db } from '../lib/firebase'
 *
 *   2. Load itinerary on mount (in the useEffect below):
 *      const unsub = onSnapshot(
 *        doc(db, 'itineraries', currentUser.uid),
 *        (snap) => {
 *          if (snap.exists()) setItinerary(snap.data().stops || [])
 *        }
 *      )
 *      return unsub
 *
 *   3. Save on every change (add a separate useEffect):
 *      useEffect(() => {
 *        if (!currentUser) return
 *        setDoc(doc(db, 'itineraries', currentUser.uid), {
 *          stops: itinerary,
 *          updatedAt: new Date(),
 *        }, { merge: true })
 *      }, [itinerary, currentUser])
 *
 * Option B — REST API / any backend:
 *   1. On mount, GET /api/itineraries/:userId → setItinerary(data.stops)
 *   2. On change, PUT /api/itineraries/:userId with { stops: itinerary }
 *
 * To get the current user, import useAuth:
 *   import { useAuth } from './AuthContext'
 *   const { currentUser } = useAuth()
 * =========================================================================
 */

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