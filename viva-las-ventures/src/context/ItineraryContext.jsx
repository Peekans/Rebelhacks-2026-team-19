import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const ItineraryContext = createContext(null)

export function useItinerary() {
  const context = useContext(ItineraryContext)
  if (!context) {
    throw new Error('useItinerary must be used within an ItineraryProvider')
  }
  return context
}

export function ItineraryProvider({ children }) {
  const { currentUser } = useAuth()
  const [itinerary, setItinerary] = useState([])

  // --- THE GLOBAL BRAIN ---
  useEffect(() => {
    console.log("🚦 [Context] Auth state changed! Current UID:", currentUser?.uid)

    // 1. If no one is logged in, WIPE the memory clean immediately
    if (!currentUser?.uid) {
      console.log("🗑️ [Context] User logged out. Clearing itinerary memory.")
      setItinerary([])
      return
    }

    // 2. Fetch the newly logged-in user's data
    async function fetchGlobalItinerary() {
      console.log(`📡 [Context] Fetching database for user: ${currentUser.uid}`)
      try {
        const docRef = doc(db, 'itineraries', currentUser.uid)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const savedData = docSnap.data()
          console.log("✅ [Context] Found saved schedule in DB!", savedData)
          setItinerary(savedData.stops || [])
        } else {
          console.log("⚠️ [Context] No schedule in DB for this user. Setting to empty.")
          setItinerary([]) 
        }
      } catch (error) {
        console.error('❌ [Context] Failed to load itinerary:', error)
      }
    }

    fetchGlobalItinerary()
  }, [currentUser?.uid]) // <-- CRITICAL FIX: Watch the UID, not the object!

  const addStop = useCallback((stop) => {
    setItinerary((prev) => {
      const stopId = stop?.id != null ? String(stop.id) : crypto.randomUUID()
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