import { useState } from 'react'
import { useItinerary } from '../context/ItineraryContext'

// Helper to check if two dates are the same day
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Helper to parse your event dates
function parseEventDate(dateString) {
  if (!dateString || dateString === 'Time TBD') return null
  const d = new Date(dateString)
  return isNaN(d.getTime()) ? null : d
}

export default function HomeCalendar() {
  const { itinerary } = useItinerary() 
  const [startDate, setStartDate] = useState(new Date())

  // Calculate the 3 days based on the current startDate
  const days = [
    new Date(startDate),
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1),
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 2),
  ]

  // Shift the calendar forward or backward
  const shiftDays = (direction) => {
    setStartDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + direction)
      return newDate
    })
  }

  // Go back to today
  const jumpToToday = () => setStartDate(new Date())

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-black/40 border border-white/10 rounded-xl">
      {/* --- Calendar Header & Controls --- */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Your Schedule</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => shiftDays(-1)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition"
          >
            &larr; Prev
          </button>
          <button 
            onClick={jumpToToday}
            className="px-3 py-1 bg-cyan-glow/20 hover:bg-cyan-glow/40 text-cyan-glow rounded transition"
          >
            Today
          </button>
          <button 
            onClick={() => shiftDays(1)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* --- 3-Day Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {days.map((day, index) => {
          // Find all itinerary stops that happen on this specific day
          const dayEvents = itinerary.filter((stop) => {
            // NEW: Check for either dateRaw OR date
            const dateString = stop.dateRaw || stop.date 
            const eventDate = parseEventDate(dateString)
            return eventDate && isSameDay(eventDate, day)
          })

          // Sort events chronologically
          dayEvents.sort((a, b) => {
            const dateA = a.dateRaw || a.date
            const dateB = b.dateRaw || b.date
            return parseEventDate(dateA) - parseEventDate(dateB)
          })

          return (
            <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 min-h-[300px]">
              {/* Day Header */}
              <h3 className="text-lg font-semibold text-white/90 mb-1 border-b border-white/10">
                {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>


              {/* Day Events */}
              {dayEvents.length === 0 ? (
                <p className="text-sm text-white/40 italic">No events scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((event, i) => {
                    // NEW: Grab the correct date string for rendering
                    const dateString = event.dateRaw || event.date
                    
                    return (
                      <div key={event.id || i} className="p-2 bg-white/10 rounded flex flex-col gap-1">
                        <span className="text-xs font-bold text-cyan-glow">
                          {parseEventDate(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <span className="text-sm text-white font-medium">{event.name}</span>
                        {event.venue && <span className="text-xs text-white/60">{event.venue}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}