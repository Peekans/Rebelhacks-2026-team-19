import { useState, useMemo } from 'react'
import { useItinerary } from '../context/ItineraryContext'

/* ============================= */
/* Helpers */
/* ============================= */

function parseLocalDateTime(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.trim().split(' ')
  if (parts.length < 2) return null
  const [y, m, d] = parts[0].split('-').map(Number)
  const [hh, mm, ss] = parts[1].split(':').map(Number)
  if (!y || !m || !d || hh == null || mm == null) return null
  return new Date(y, m - 1, d, hh, mm, ss || 0)
}

function calculateEventLayout(dayEvents, eventDurationHours = 1.5) {
  const eventsWithTime = dayEvents
    .map((stop) => {
      const dt = parseLocalDateTime(stop.dateRaw)
      const startHour = dt ? dt.getHours() + dt.getMinutes() / 60 : 0
      const endHour = startHour + eventDurationHours
      return { ...stop, dt, startHour, endHour }
    })
    .sort((a, b) => a.startHour - b.startHour)

  const groups = []
  let currentGroup = []
  let currentGroupEnd = 0

  eventsWithTime.forEach((ev) => {
    if (currentGroup.length === 0) {
      currentGroup.push(ev)
      currentGroupEnd = ev.endHour
    } else if (ev.startHour < currentGroupEnd) {
      currentGroup.push(ev)
      currentGroupEnd = Math.max(currentGroupEnd, ev.endHour)
    } else {
      groups.push(currentGroup)
      currentGroup = [ev]
      currentGroupEnd = ev.endHour
    }
  })
  if (currentGroup.length > 0) groups.push(currentGroup)

  const layoutEvents = []
  groups.forEach((group) => {
    const columns = []
    
    group.forEach((ev) => {
      let colIndex = columns.findIndex((col) => {
        const lastInCol = col[col.length - 1]
        return ev.startHour >= lastInCol.endHour
      })

      if (colIndex === -1) {
        colIndex = columns.length
        columns.push([])
      }
      columns[colIndex].push(ev)
      ev.colIndex = colIndex
    })

    const numCols = columns.length
    group.forEach((ev) => {
      layoutEvents.push({ ...ev, numCols })
    })
  })

  return layoutEvents
}

/* ============================= */
/* Icons */
/* ============================= */

function IconMap(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.5 3.5 18V4l5.5 2.5L15 4l5.5 2.5V20.5L15 18l-6 2.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.5v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4v14" />
    </svg>
  )
}
function IconChevronLeft(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}
function IconChevronRight(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}
function IconDownload(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

/* ============================= */
/* Component */
/* ============================= */

export default function CalendarWidget() {
  const { itinerary } = useItinerary()
  const [calendarStartDate, setCalendarStartDate] = useState(() => new Date())

  const VISUAL_DURATION = 1.5
  const HOUR_HEIGHT = 64
  const CALENDAR_TOTAL_HEIGHT = 24 * HOUR_HEIGHT

  const shiftCalendar = (days) => {
    setCalendarStartDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + days)
      return d
    })
  }

  const calendarDays = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const d = new Date(calendarStartDate)
      d.setDate(d.getDate() + offset)
      return d
    })
  }, [calendarStartDate])

  const headerDateRange = `${calendarDays[0].toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${calendarDays[2].toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`

  const hours = Array.from({ length: 24 }, (_, i) => i)

  function formatHour(h) {
    if (h === 0) return '12 AM'
    if (h === 12) return '12 PM'
    return h > 12 ? `${h - 12} PM` : `${h} AM`
  }

  function getEventsForDay(dayDate) {
    return itinerary.filter((stop) => {
      const dt = parseLocalDateTime(stop.dateRaw)
      if (!dt) return false
      return (
        dt.getFullYear() === dayDate.getFullYear() &&
        dt.getMonth() === dayDate.getMonth() &&
        dt.getDate() === dayDate.getDate()
      )
    })
  }

  function handleExportCalendar() {
    if (itinerary.length === 0) return

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Viva Las Ventures//Itinerary//EN\nCALSCALE:GREGORIAN\n"

    itinerary.forEach((stop) => {
      const dt = parseLocalDateTime(stop.dateRaw)
      if (!dt) return 
      const endDate = new Date(dt.getTime() + VISUAL_DURATION * 60 * 60 * 1000)

      const formatICSDate = (d) => {
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
      }

      const safeName = (stop.name || 'Event').replace(/,/g, '\\,')
      const safeVenue = (stop.venue || '').replace(/,/g, '\\,')

      icsContent += "BEGIN:VEVENT\n"
      icsContent += `SUMMARY:${safeName}\n`
      if (safeVenue) icsContent += `LOCATION:${safeVenue}\n`
      icsContent += `DTSTART:${formatICSDate(dt)}\n`
      icsContent += `DTEND:${formatICSDate(endDate)}\n`
      icsContent += "END:VEVENT\n"
    })

    icsContent += "END:VCALENDAR"

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Vegas_Itinerary.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url) 
  }

  return (
    <section className="mt-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-white">Schedule Preview</h2>
        
        <div className="flex items-center gap-3">
          {itinerary.length > 0 && (
            <button 
              onClick={handleExportCalendar}
              className="text-xs font-body flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-full transition-colors"
            >
              <IconDownload className="w-3.5 h-3.5" />
              Export .ics
            </button>
          )}
          <span className="text-xs text-cyan-glow bg-cyan-glow/10 px-3 py-1.5 rounded-full font-medium">My Private Trip</span>
        </div>
      </div>

      <div className="bg-surface/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Calendar Header */}
        <div className="flex items-center justify-between bg-white/5 border-b border-white/10 p-4">
          <div className="text-xs text-white/40 font-body uppercase tracking-wider w-16 text-right pr-2">
            GMT-08
          </div>

          <div className="flex-1 grid grid-cols-3">
            {calendarDays.map((day, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <span className="text-xs font-semibold text-cyan-glow tracking-widest uppercase mb-1">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <div className="w-8 h-8 rounded-full bg-cyan-glow text-background flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-2 py-1 ml-4 shadow-sm">
            <button onClick={() => shiftCalendar(-3)} className="p-2 text-white/50 hover:text-white transition-colors">
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-body text-white/90 whitespace-nowrap min-w-[110px] text-center">
              {headerDateRange}
            </span>
            <button onClick={() => shiftCalendar(3)} className="p-2 text-white/50 hover:text-white transition-colors">
              <IconChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="h-[600px] overflow-y-auto relative bg-[#0B0F19]/20 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="flex w-full" style={{ height: CALENDAR_TOTAL_HEIGHT }}>
            {/* Time Axis */}
            <div className="w-16 flex-shrink-0 border-r border-white/10 flex flex-col relative z-10 bg-surface/40">
              {hours.map((h) => (
                <div key={h} className="relative text-right pr-3 text-[10px] text-white/40 font-body" style={{ height: HOUR_HEIGHT }}>
                  {h !== 0 && (
                    <span className="absolute -top-2 right-3 bg-surface px-1">{formatHour(h)}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            <div className="flex-1 grid grid-cols-3 relative">
              <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                {hours.map((h) => (
                  <div key={h} className="w-full border-b border-white/5" style={{ height: HOUR_HEIGHT }} />
                ))}
              </div>

              {calendarDays.map((day, i) => {
                const dayEventsRaw = getEventsForDay(day)
                const layoutEvents = calculateEventLayout(dayEventsRaw, VISUAL_DURATION)

                return (
                  <div key={i} className="relative border-r border-white/5 last:border-0 z-10">
                    {layoutEvents.map((stop) => {
                      const topPx = stop.startHour * HOUR_HEIGHT
                      const isCustom = String(stop.category || '').toLowerCase() === 'custom'
                      const widthPct = 100 / stop.numCols
                      const leftPct = stop.colIndex * widthPct

                      return (
                        <div
                          key={stop.id || stop.tmId}
                          className={`absolute p-2 rounded-lg text-white overflow-hidden shadow-lg border backdrop-blur-md transition-all hover:scale-[1.02] cursor-default
                            ${isCustom ? 'bg-primary/80 border-primary shadow-primary/20' : 'bg-blue-600/80 border-blue-500 shadow-blue-500/20'}
                          `}
                          style={{ 
                            top: topPx, 
                            height: HOUR_HEIGHT * VISUAL_DURATION,
                            left: `calc(${leftPct}% + 4px)`,
                            width: `calc(${widthPct}% - 8px)`
                          }}
                        >
                          <p className="text-xs font-semibold leading-tight mb-1 truncate">{stop.name}</p>
                          {stop.venue && stop.numCols < 3 && ( 
                            <p className="text-[10px] text-white/70 leading-tight truncate flex items-center gap-1">
                              <IconMap className="w-3 h-3" />
                              {stop.venue}
                            </p>
                          )}
                          <p className="text-[10px] text-white/90 mt-1 font-mono">
                            {stop.dt ? stop.dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}