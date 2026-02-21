/**
 * Builder Page
 *
 * Features:
 * - Ticketmaster Upcoming Events + images
 * - Add to itinerary (added events disappear from Upcoming list)
 * - Remove from itinerary
 * - Conflict warning for same start minute
 * - Add Custom Event modal (name + start date/time + icon)
 * - Custom events have NO picture
 * - Itinerary separated into "Events" and "Custom Events"
 * - Filter Upcoming Events by icon type
 * - Load More moved to bottom and centered
 * - Human-friendly time formatting
 * - Custom Internal Calendar (syncs with itinerary)
 * - Dynamic Event Overlap Handling
 * - Auto-scroll on Load More
 * - Export to .ics (Google/Apple Calendar compatible)
 */

import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useItinerary } from '../context/ItineraryContext'
import Logo from '../components/logo'

/* ============================= */
/* Helpers */
/* ============================= */

function getUserDisplayName(user) {
  if (!user) return 'Guest'
  if (user.displayName) return user.displayName
  if (user.email) return user.email.split('@')[0]
  return 'Guest'
}

function pickBestImage(images) {
  if (!Array.isArray(images) || images.length === 0) return ''
  const preferred = images
    .filter((img) => (img.width ?? 0) >= 200)
    .sort((a, b) => (a.width ?? 9999) - (b.width ?? 9999))
  return (preferred[0] || images[0])?.url || ''
}

function toIsoNoMs(d) {
  return new Date(d.getTime() - d.getMilliseconds()).toISOString().replace('.000', '')
}

// Parses "YYYY-MM-DD HH:MM:SS" (local) -> Date (local)
function parseLocalDateTime(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.trim().split(' ')
  if (parts.length < 2) return null
  const [y, m, d] = parts[0].split('-').map(Number)
  const [hh, mm, ss] = parts[1].split(':').map(Number)
  if (!y || !m || !d || hh == null || mm == null) return null
  return new Date(y, m - 1, d, hh, mm, ss || 0)
}

// Human date: "Feb 20 • 6:30 PM"
function formatEventDate(dateStr) {
  const dt = parseLocalDateTime(dateStr)
  if (!dt) return dateStr || 'Time TBD'

  const str = dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return str.replace(',', ' •')
}

// Used for conflict check (minute precision)
function getMinuteKey(dateStr) {
  const dt = parseLocalDateTime(dateStr)
  if (!dt) return ''
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const mi = String(dt.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

function displayFromDateTimeLocal(v) {
  if (!v) return 'Time TBD'
  const [d, t] = v.split('T')
  if (!d || !t) return 'Time TBD'
  return `${d} ${t}:00`
}

function inferIconTypeFromCategory(category) {
  const c = (category || '').toLowerCase()
  if (c.includes('music') || c.includes('concert')) return 'music'
  if (c.includes('sport')) return 'ticket'
  if (c.includes('food') || c.includes('dining') || c.includes('restaurant')) return 'food'
  if (c.includes('theatre') || c.includes('theater') || c.includes('arts') || c.includes('show')) return 'sparkles'
  if (c.includes('attraction') || c.includes('tour') || c.includes('travel')) return 'map'
  return 'ticket'
}

function normalizeTicketmasterEvent(e) {
  const venue =
    e?._embedded?.venues?.[0]?.name ||
    e?._embedded?.venues?.[0]?.address?.line1 ||
    'Unknown venue'

  const localDate = e?.dates?.start?.localDate || ''
  let localTime = e?.dates?.start?.localTime || ''

  if (localDate && !localTime) {
    localTime = '12:00:00'
  }

  const dateRaw = [localDate, localTime].filter(Boolean).join(' ') || 'Time TBD'
  const date = dateRaw === 'Time TBD' ? 'Time TBD' : formatEventDate(dateRaw)

  return {
    id: e.id,
    name: e.name || 'Untitled Event',
    venue,
    dateRaw,
    date,
    imageUrl: pickBestImage(e.images),
    category: e?.classifications?.[0]?.segment?.name || 'Event',
    iconKey: null, 
  }
}

/* ============================= */
/* Layout Algorithm */
/* ============================= */

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

function IconTicket(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
    </svg>
  )
}
function IconMusic(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
    </svg>
  )
}
function IconSparkles(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}
function IconFood(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v8a4 4 0 1 0 8 0V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v6" />
    </svg>
  )
}
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

const ICON_CHOICES = [
  { key: 'ticket', label: 'Event', Icon: IconTicket },
  { key: 'music', label: 'Music', Icon: IconMusic },
  { key: 'sparkles', label: 'Show', Icon: IconSparkles },
  { key: 'food', label: 'Food', Icon: IconFood },
  { key: 'map', label: 'Place', Icon: IconMap },
]

function getIconByKey(iconKey) {
  return ICON_CHOICES.find((c) => c.key === iconKey)?.Icon || null
}

function getCategoryIcon(category, iconKeyOrType) {
  const Override = iconKeyOrType ? getIconByKey(iconKeyOrType) : null
  if (Override) return <Override className="w-5 h-5" />

  const inferred = inferIconTypeFromCategory(category)
  const InferredIcon = getIconByKey(inferred) || IconTicket
  return <InferredIcon className="w-5 h-5" />
}

/* ============================= */
/* Component */
/* ============================= */

export default function Builder() {
  const { currentUser, logout } = useAuth()
  const displayName = getUserDisplayName(currentUser)
  const { itinerary, addStop, removeStop } = useItinerary()

  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [page, setPage] = useState(0)
  const [loadingEvents, setLoadingEvents] = useState(false)

  // Auto-scroll ref
  const eventsListRef = useRef(null)
  const prevEventCount = useRef(0)

  // Calendar State
  const [calendarStartDate, setCalendarStartDate] = useState(() => new Date())

  // Filter UI
  const [showFilter, setShowFilter] = useState(false)
  const [activeIconFilters, setActiveIconFilters] = useState({
    ticket: true,
    music: true,
    sparkles: true,
    food: true,
    map: true,
  })

  // Custom Event modal
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDateTime, setCustomDateTime] = useState('')
  const [customIconKey, setCustomIconKey] = useState('ticket')

  const apiKey = import.meta.env.VITE_TICKETMASTER_KEY || ''
  const VISUAL_DURATION = 1.5 // 1.5 hours per event block

  useEffect(() => {
    let cancelled = false

    async function fetchEvents() {
      if (!apiKey) return
      setLoadingEvents(true)

      const startDateTime = toIsoNoMs(new Date())
      const url =
        `https://app.ticketmaster.com/discovery/v2/events.json` +
        `?apikey=${encodeURIComponent(apiKey)}` +
        `&city=Las%20Vegas` +
        `&sort=date,asc` +
        `&startDateTime=${encodeURIComponent(startDateTime)}` +
        `&locale=*` +
        `&size=20` +
        `&page=${page}`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Ticketmaster error ${res.status}`)
        const data = await res.json()
        const raw = data?._embedded?.events ?? []
        const normalized = raw.map(normalizeTicketmasterEvent)

        if (!cancelled) {
          setUpcomingEvents((prev) => (page === 0 ? normalized : [...prev, ...normalized]))
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoadingEvents(false)
      }
    }

    fetchEvents()
    return () => {
      cancelled = true
    }
  }, [apiKey, page])

  const itineraryTmIds = useMemo(() => {
    const s = new Set()
    for (const stop of itinerary) {
      const tm = stop.tmId ?? stop.ticketmasterId ?? stop.sourceId
      if (tm) s.add(String(tm))
    }
    return s
  }, [itinerary])

  const itineraryMinuteKeys = useMemo(() => {
    const set = new Set()
    for (const stop of itinerary) {
      const raw = stop.dateRaw || stop.date
      const k = getMinuteKey(raw)
      if (k) set.add(k)
    }
    return set
  }, [itinerary])

  const visibleUpcomingEvents = useMemo(() => {
    const base = upcomingEvents.filter((e) => !itineraryTmIds.has(String(e.id)))
    return base.filter((e) => {
      const iconType = e.iconKey || inferIconTypeFromCategory(e.category)
      return !!activeIconFilters[iconType]
    })
  }, [upcomingEvents, itineraryTmIds, activeIconFilters])

  useEffect(() => {
    if (page > 0 && eventsListRef.current && visibleUpcomingEvents.length > prevEventCount.current) {
      eventsListRef.current.scrollBy({ top: 350, behavior: 'smooth' })
    }
    prevEventCount.current = visibleUpcomingEvents.length
  }, [visibleUpcomingEvents, page])

  const { nonCustomStops, customStops } = useMemo(() => {
    const nonCustom = []
    const custom = []
    for (const s of itinerary) {
      const isCustom = String(s.category || '').toLowerCase() === 'custom'
      if (isCustom) custom.push(s)
      else nonCustom.push(s)
    }
    return { nonCustomStops: nonCustom, customStops: custom }
  }, [itinerary])

  /* ============================= */
  /* Calendar Logic */
  /* ============================= */

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

  const HOUR_HEIGHT = 64
  const CALENDAR_TOTAL_HEIGHT = 24 * HOUR_HEIGHT

  /* ============================= */
  /* Actions */
  /* ============================= */

  function resetCustomModal() {
    setCustomName('')
    setCustomDateTime('')
    setCustomIconKey('ticket')
  }

  function submitCustomEvent(e) {
    e.preventDefault()

    const trimmed = customName.trim()
    if (!trimmed) return

    const dateRaw = displayFromDateTimeLocal(customDateTime)
    const date = dateRaw === 'Time TBD' ? 'Time TBD' : formatEventDate(dateRaw)
    const minuteKey = getMinuteKey(dateRaw)

    const sourceId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `custom-${crypto.randomUUID()}`
        : `custom-${Date.now()}`

    addStop?.({
      tmId: sourceId,
      name: trimmed,
      venue: 'Custom event',
      dateRaw,
      date,
      category: 'Custom',
      iconKey: customIconKey,
      minuteKey,
    })

    setShowCustomModal(false)
    resetCustomModal()
  }

  // Generate and download an .ics file from the itinerary state
  function handleExportCalendar() {
    if (itinerary.length === 0) return

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Viva Las Ventures//Itinerary//EN\nCALSCALE:GREGORIAN\n"

    itinerary.forEach((stop) => {
      const dt = parseLocalDateTime(stop.dateRaw)
      if (!dt) return // Skip if no valid date

      // Add visual duration to start time to get the end time
      const endDate = new Date(dt.getTime() + VISUAL_DURATION * 60 * 60 * 1000)

      // Format to YYYYMMDDTHHMMSS (Floating Time)
      const formatICSDate = (d) => {
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
      }

      // Escape commas and newlines in text fields
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

    // Create a Blob and trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Vegas_Itinerary.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url) // Clean up
  }

  function ItineraryRow({ stop, indexLabel }) {
    const isCustom = String(stop.category || '').toLowerCase() === 'custom'
    const hasImage = !!stop.imageUrl && !isCustom

    return (
      <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold font-body shrink-0">
          {indexLabel}
        </div>

        <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 text-cyan-glow flex items-center justify-center shrink-0">
          {getCategoryIcon(stop.category, stop.iconKey)}
        </div>

        {hasImage && (
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
            <img src={stop.imageUrl} alt={stop.name} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-white truncate">{stop.name}</p>
          {stop.venue && <p className="text-xs text-white/40 font-body truncate">{stop.venue}</p>}
          {stop.date && <p className="text-xs text-primary/80 font-body truncate">{stop.date}</p>}
        </div>

        <button
          type="button"
          onClick={() => removeStop?.(stop.id)}
          className="w-9 h-9 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/15 hover:text-red-300 transition-colors shrink-0 flex items-center justify-center"
          title="Remove"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-heading text-lg text-white tracking-wide">Viva Las Ventures</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-accent/80 font-body hidden sm:block">{displayName}</span>
            </div>
            <button onClick={logout} className="text-sm text-white/40 hover:text-white transition-colors font-body">
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">Build Itinerary</h1>
              <p className="text-white/50 font-body mt-2">Add events from the right panel to your itinerary on the left.</p>
            </div>
            <Link to="/home" className="text-sm text-cyan-glow hover:text-cyan-glow/80 transition-colors font-body">
              Back to Home
            </Link>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ===== ITINERARY ===== */}
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-semibold text-white">Your Itinerary</h2>

                <button
                  type="button"
                  onClick={() => setShowCustomModal(true)}
                  className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full transition-colors font-body"
                >
                  + Custom
                </button>
              </div>

              {itinerary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40 font-body text-sm">No stops added yet</p>
                </div>
              ) : (
                <div className="max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-1 mb-3">
                      <p className="text-xs tracking-wide uppercase text-white/40 font-body">Events</p>
                      <p className="text-xs text-white/30 font-body">{nonCustomStops.length}</p>
                    </div>

                    {nonCustomStops.length === 0 ? (
                      <p className="text-xs text-white/30 font-body px-1">No events yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {nonCustomStops.map((stop, i) => (
                          <ItineraryRow key={stop.id} stop={stop} indexLabel={i + 1} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="my-6 border-t border-white/10" />

                  <div>
                    <div className="flex items-center justify-between px-1 mb-3">
                      <p className="text-xs tracking-wide uppercase text-white/40 font-body">Custom Events</p>
                      <p className="text-xs text-white/30 font-body">{customStops.length}</p>
                    </div>

                    {customStops.length === 0 ? (
                      <p className="text-xs text-white/30 font-body px-1">No custom events yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {customStops.map((stop, i) => (
                          <ItineraryRow key={stop.id} stop={stop} indexLabel={i + 1} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ===== UPCOMING EVENTS ===== */}
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6 relative">
                <h2 className="text-2xl font-heading font-semibold text-white">Upcoming Events</h2>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilter((v) => !v)}
                    className="text-sm text-cyan-glow hover:text-cyan-glow/80 transition-colors font-body"
                  >
                    Filter
                  </button>

                  {showFilter && (
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-surface/95 border border-white/10 shadow-xl p-4 z-50">
                      <p className="text-xs uppercase tracking-wide text-white/40 font-body mb-3">Icon Types</p>

                      {ICON_CHOICES.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-3 py-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!activeIconFilters[opt.key]}
                            onChange={(e) =>
                              setActiveIconFilters((prev) => ({
                                ...prev,
                                [opt.key]: e.target.checked,
                              }))
                            }
                          />
                          <span className="text-sm text-white/70 font-body">{opt.label}</span>
                        </label>
                      ))}

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveIconFilters({
                              ticket: true,
                              music: true,
                              sparkles: true,
                              food: true,
                              map: true,
                            })
                          }
                          className="flex-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl py-2 font-body transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveIconFilters({
                              ticket: false,
                              music: false,
                              sparkles: false,
                              food: false,
                              map: false,
                            })
                          }
                          className="flex-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl py-2 font-body transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowFilter(false)}
                        className="mt-3 w-full text-xs text-white/40 hover:text-white/70 font-body transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div 
                ref={eventsListRef} 
                className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              >
                {visibleUpcomingEvents.map((event) => {
                  const raw = event.dateRaw || event.date
                  const minuteKey = getMinuteKey(raw)
                  const hasConflict = minuteKey && itineraryMinuteKeys.has(minuteKey)

                  const iconType = event.iconKey || inferIconTypeFromCategory(event.category)

                  return (
                    <div key={event.id} className="group flex items-center gap-4 bg-white/5 rounded-xl p-4 hover:bg-white/8 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 text-cyan-glow flex items-center justify-center shrink-0">
                        {getCategoryIcon(event.category, iconType)}
                      </div>

                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body text-white font-medium truncate">{event.name}</p>
                        <p className="text-xs text-white/40 font-body truncate">{event.venue}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-primary font-body font-medium whitespace-nowrap">{event.date}</p>
                        {hasConflict && (
                          <p className="text-[11px] text-red-400 font-body mt-1 whitespace-nowrap">Time conflict</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => addStop?.({ ...event, tmId: event.id, minuteKey })}
                        className="w-9 h-9 rounded-lg bg-white/5 text-white/40 hover:bg-primary/20 hover:text-primary transition-colors shrink-0 flex items-center justify-center"
                        title="Add to itinerary"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                  )
                })}

                {loadingEvents && <p className="text-xs text-white/30 font-body pt-2 text-center">Loading more…</p>}

                {!loadingEvents && visibleUpcomingEvents.length === 0 && (
                  <p className="text-xs text-white/30 font-body pt-2 text-center">No events match your filters.</p>
                )}
              </div>

              <div className="pt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-6 py-2 rounded-full transition-colors font-body"
                >
                  Load More
                </button>
              </div>
            </div>
          </section>

          {/* ===== CUSTOM CALENDAR VIEW ===== */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-semibold text-white">Schedule Preview</h2>
              
              <div className="flex items-center gap-3">
                {/* NEW EXPORT BUTTON */}
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

              {/* Calendar Body (Scrollable Time Grid) */}
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
                    {/* Horizontal Grid Lines */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                      {hours.map((h) => (
                        <div key={h} className="w-full border-b border-white/5" style={{ height: HOUR_HEIGHT }} />
                      ))}
                    </div>

                    {/* Vertical Day Separators & Events */}
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

        </div>
      </main>

      {/* ===== CUSTOM EVENT MODAL ===== */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomModal(false)
              resetCustomModal()
            }
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative w-full max-w-lg bg-surface/90 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-heading font-semibold text-white">Add custom event</h3>
                <p className="text-sm text-white/50 font-body mt-1">Create something that’s not on Ticketmaster.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCustomModal(false)
                  resetCustomModal()
                }}
                className="w-9 h-9 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={submitCustomEvent} className="space-y-5">
              <div>
                <label className="block text-sm text-white/70 font-body mb-2">Event name</label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Dinner at Best Friend"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-cyan-glow/40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 font-body mb-2">Start date & time</label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-glow/40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 font-body mb-2">Choose an icon</label>

                <div className="grid grid-cols-5 gap-3">
                  {ICON_CHOICES.map(({ key, label, Icon }) => {
                    const selected = customIconKey === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCustomIconKey(key)}
                        className={[
                          'rounded-xl border transition-colors p-3 flex flex-col items-center gap-2',
                          selected
                            ? 'bg-cyan-glow/10 border-cyan-glow/40 text-cyan-glow'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70',
                        ].join(' ')}
                      >
                        <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-body">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomModal(false)
                    resetCustomModal()
                  }}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors font-body text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary transition-colors font-body text-sm"
                >
                  Add event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}