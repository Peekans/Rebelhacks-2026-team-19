/**
 * Builder Page — Drag-and-Drop Itinerary Builder
 *
 * Allows users to build their Vegas itinerary by:
 * - Viewing sample events in a sidebar panel
 * - Dragging events from the sidebar into the schedule area (or clicking "+")
 * - Reordering schedule items via drag-and-drop
 * - Removing items from the schedule
 * - Clicking "Done" to finalize and save the itinerary
 *
 * Uses @dnd-kit for drag-and-drop functionality.
 *
 * =========================================================================
 * DATABASE PERSISTENCE (TODO):
 * Currently the itinerary is stored in React context (in-memory only).
 * To persist across sessions, integrate with your database:
 *
 * Option A — Firebase Firestore:
 *   import { doc, setDoc, getDoc } from 'firebase/firestore'
 *   import { db } from '../lib/firebase'
 *
 *   // Save itinerary:
 *   await setDoc(doc(db, 'itineraries', `${userId}_${itineraryId}`), {
 *     userId,
 *     stops: scheduleItems,
 *     createdAt: new Date(),
 *     name: 'My Vegas Trip',
 *   })
 *
 *   // Load itinerary:
 *   const snap = await getDoc(doc(db, 'itineraries', `${userId}_${itineraryId}`))
 *   if (snap.exists()) setScheduleItems(snap.data().stops)
 *
 * Option B — Any REST API:
 *   await fetch('/api/itineraries', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ userId, stops: scheduleItems }),
 *   })
 * =========================================================================
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useItinerary } from '../context/ItineraryContext'
import Logo from '../components/Logo'

// =========================================================================
// SAMPLE EVENTS
// These are hardcoded for demo purposes. In production, you would fetch
// real events from the Ticketmaster API (see src/lib/ticketmaster.js)
// or your own database.
//
// To use live Ticketmaster data:
//   import { searchEvents } from '../lib/ticketmaster'
//   const data = await searchEvents({ classificationName: 'music' })
//   const events = data._embedded?.events || []
//
// To use your own database:
//   import { collection, getDocs } from 'firebase/firestore'
//   import { db } from '../lib/firebase'
//   const snap = await getDocs(collection(db, 'events'))
//   const events = snap.docs.map(d => ({ id: d.id, ...d.data() }))
// =========================================================================
const SAMPLE_EVENTS = [
  {
    id: 'e1',
    name: 'Cirque du Soleil: "O"',
    venue: 'Bellagio Hotel & Casino',
    time: '7:00 PM',
    category: 'Show',
  },
  {
    id: 'e2',
    name: 'Bruno Mars Concert',
    venue: 'Park MGM',
    time: '9:00 PM',
    category: 'Concert',
  },
  {
    id: 'e3',
    name: 'High Roller Observation Wheel',
    venue: 'The LINQ Promenade',
    time: 'Any time',
    category: 'Attraction',
  },
  {
    id: 'e4',
    name: 'Gordon Ramsay Steak Dinner',
    venue: 'Paris Las Vegas',
    time: '6:30 PM',
    category: 'Dining',
  },
  {
    id: 'e5',
    name: 'Fremont Street Experience',
    venue: 'Downtown Las Vegas',
    time: 'Evening',
    category: 'Attraction',
  },
  {
    id: 'e6',
    name: 'Raiders vs. Chiefs',
    venue: 'Allegiant Stadium',
    time: '5:30 PM',
    category: 'Sports',
  },
  {
    id: 'e7',
    name: 'Blue Man Group',
    venue: 'Luxor Hotel & Casino',
    time: '8:00 PM',
    category: 'Show',
  },
  {
    id: 'e8',
    name: 'Pool Party at Wet Republic',
    venue: 'MGM Grand',
    time: '11:00 AM',
    category: 'Nightlife',
  },
  {
    id: 'e9',
    name: 'Gondola Rides',
    venue: 'The Venetian',
    time: 'Any time',
    category: 'Attraction',
  },
  {
    id: 'e10',
    name: 'Penn & Teller',
    venue: 'Rio All-Suite Hotel',
    time: '9:00 PM',
    category: 'Show',
  },
]

const CATEGORY_COLORS = {
  Show: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Concert: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Attraction: 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/30',
  Dining: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Sports: 'bg-green-500/20 text-green-300 border-green-500/30',
  Nightlife: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

// ===== DRAGGABLE SIDEBAR EVENT =====
function DraggableSidebarEvent({ event, onAdd }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `sample-${event.id}`,
      data: { type: 'sample-event', event },
    })

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  const categoryStyle =
    CATEGORY_COLORS[event.category] || 'bg-white/10 text-white/60'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-surface border border-white/5 rounded-xl p-4 hover:border-cyan-glow/20 transition-all cursor-grab active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryStyle}`}
            >
              {event.category}
            </span>
            <span className="text-[11px] text-white/30 font-body">
              {event.time}
            </span>
          </div>
          <p className="text-sm font-body text-white font-medium truncate">
            {event.name}
          </p>
          <p className="text-xs text-white/40 font-body truncate">
            {event.venue}
          </p>
        </div>
        {/* Add button (click alternative to drag) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(event)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-lg bg-white/5 text-white/30 flex items-center justify-center hover:bg-cyan-glow/20 hover:text-cyan-glow transition-colors shrink-0"
          title="Add to schedule"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ===== SORTABLE SCHEDULE ITEM =====
function SortableScheduleItem({ item, onRemove, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const categoryStyle =
    CATEGORY_COLORS[item.category] || 'bg-white/10 text-white/60'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-surface border border-white/10 rounded-xl p-4 hover:border-cyan-glow/20 transition-all"
    >
      {/* Drag handle */}
      <div
        className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9h16.5m-16.5 6.75h16.5"
          />
        </svg>
      </div>

      {/* Stop number */}
      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold font-body shrink-0">
        {index + 1}
      </div>

      {/* Event details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-body text-white font-medium truncate">
            {item.name}
          </p>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${categoryStyle}`}
          >
            {item.category}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-white/40 font-body truncate">
            {item.venue}
          </p>
          <span className="text-xs text-white/30 font-body">{item.time}</span>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="w-8 h-8 rounded-lg bg-white/5 text-white/20 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
        title="Remove from schedule"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

// ===== DRAG OVERLAY (visual during drag) =====
function DragOverlayContent({ event }) {
  if (!event) return null
  const categoryStyle =
    CATEGORY_COLORS[event.category] || 'bg-white/10 text-white/60'

  return (
    <div className="bg-surface border border-cyan-glow/40 rounded-xl p-4 shadow-lg shadow-cyan-glow/10 w-72">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryStyle}`}
        >
          {event.category}
        </span>
      </div>
      <p className="text-sm font-body text-white font-medium">{event.name}</p>
      <p className="text-xs text-white/40 font-body">{event.venue}</p>
    </div>
  )
}

// ===== MAIN BUILDER COMPONENT =====
export default function Builder() {
  const navigate = useNavigate()
  const { reorderStops } = useItinerary()

  // Schedule items — events the user has added to their itinerary
  const [scheduleItems, setScheduleItems] = useState([])
  // Track which event is being dragged for the DragOverlay
  const [activeEvent, setActiveEvent] = useState(null)
  // Track if sidebar filter is active
  const [categoryFilter, setCategoryFilter] = useState('All')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const categories = [
    'All',
    ...new Set(SAMPLE_EVENTS.map((e) => e.category)),
  ]

  const filteredEvents =
    categoryFilter === 'All'
      ? SAMPLE_EVENTS
      : SAMPLE_EVENTS.filter((e) => e.category === categoryFilter)

  // Add an event from the sidebar to the schedule
  function addToSchedule(event) {
    // Allow adding the same event type multiple times (each gets unique ID)
    const newItem = {
      ...event,
      id: crypto.randomUUID(),
      originalId: event.id,
    }
    setScheduleItems((prev) => [...prev, newItem])
  }

  // Remove an item from the schedule
  function removeFromSchedule(itemId) {
    setScheduleItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  // Handle drag start — set the active event for DragOverlay
  function handleDragStart(event) {
    const { active } = event
    if (String(active.id).startsWith('sample-')) {
      setActiveEvent(active.data.current.event)
    } else {
      const item = scheduleItems.find((i) => i.id === active.id)
      if (item) setActiveEvent(item)
    }
  }

  // Handle drag end — add or reorder
  function handleDragEnd(event) {
    const { active, over } = event
    setActiveEvent(null)

    if (!over) return

    const activeId = String(active.id)

    // Case 1: Dragging a sample event from the sidebar
    if (activeId.startsWith('sample-')) {
      const eventData = active.data.current?.event
      if (eventData) {
        // Dropped over the schedule area or any schedule item → add it
        const overId = String(over.id)
        if (
          overId === 'schedule-drop-zone' ||
          scheduleItems.some((i) => i.id === overId)
        ) {
          addToSchedule(eventData)
        }
      }
      return
    }

    // Case 2: Reordering within the schedule
    const overId = String(over.id)
    if (activeId !== overId) {
      const oldIndex = scheduleItems.findIndex((i) => i.id === activeId)
      const newIndex = scheduleItems.findIndex((i) => i.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        setScheduleItems((prev) => arrayMove(prev, oldIndex, newIndex))
      }
    }
  }

  // Finalize itinerary and navigate to home
  function handleDone() {
    // Save to itinerary context so it shows on the home page
    const stops = scheduleItems.map((item) => ({
      id: item.id,
      name: item.name,
      venue: item.venue,
      time: item.time,
      category: item.category,
    }))
    reorderStops(stops)

    /*
     * =====================================================================
     * DATABASE SAVE (TODO):
     * This is where you would persist the itinerary to your database.
     *
     * Firebase Firestore example:
     *   import { doc, setDoc } from 'firebase/firestore'
     *   import { db } from '../lib/firebase'
     *   import { useAuth } from '../context/AuthContext'
     *
     *   const { currentUser } = useAuth()
     *   await setDoc(doc(db, 'itineraries', currentUser.uid), {
     *     userId: currentUser.uid,
     *     stops,
     *     updatedAt: new Date(),
     *   })
     *
     * REST API example:
     *   await fetch('/api/itineraries', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
     *     body: JSON.stringify({ stops }),
     *   })
     * =====================================================================
     */

    navigate('/home')
  }

  // Droppable schedule area wrapper
  function ScheduleDropZone({ children }) {
    const { setNodeRef, isOver } = useDroppable({ id: 'schedule-drop-zone' })
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-2xl border-2 border-dashed transition-colors ${
          isOver
            ? 'border-cyan-glow/50 bg-cyan-glow/5'
            : 'border-white/10 bg-transparent'
        }`}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="text-white/50 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <Logo size={28} />
              <h1 className="text-base font-heading font-semibold text-white">
                Itinerary Builder
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40 font-body">
              {scheduleItems.length} stop{scheduleItems.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleDone}
              disabled={scheduleItems.length === 0}
              className="bg-primary text-background font-semibold px-6 py-2 rounded-full text-sm hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Done
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="pt-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ===== SCHEDULE (left/center — 2 cols) ===== */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-white">
                    Your Schedule
                  </h2>
                  <p className="text-sm text-white/40 font-body mt-1">
                    Drag events from the sidebar or click "+" to add them.
                    Reorder by dragging.
                  </p>
                </div>
                {scheduleItems.length > 0 && (
                  <button
                    onClick={() => setScheduleItems([])}
                    className="text-sm text-white/30 hover:text-red-400 transition-colors font-body"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <ScheduleDropZone>
                {scheduleItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-white/15"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                    </div>
                    <p className="text-white/30 font-body text-sm mb-2">
                      Your schedule is empty
                    </p>
                    <p className="text-white/20 font-body text-xs max-w-xs">
                      Drag events from the sidebar on the right, or click the
                      "+" button to add them to your itinerary.
                    </p>
                  </div>
                ) : (
                  <SortableContext
                    items={scheduleItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 p-4">
                      {scheduleItems.map((item, index) => (
                        <SortableScheduleItem
                          key={item.id}
                          item={item}
                          index={index}
                          onRemove={removeFromSchedule}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </ScheduleDropZone>

              {/* Done button (bottom, prominent) */}
              {scheduleItems.length > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-sm text-white/40 font-body">
                    {scheduleItems.length} event
                    {scheduleItems.length !== 1 ? 's' : ''} in your itinerary
                  </p>
                  <button
                    onClick={handleDone}
                    className="bg-primary text-background font-semibold px-8 py-3 rounded-full text-sm hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    Done — Save Itinerary
                  </button>
                </div>
              )}
            </div>

            {/* ===== SIDEBAR — SAMPLE EVENTS (right — 1 col) ===== */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-heading font-semibold text-white mb-1">
                  Sample Events
                </h2>
                <p className="text-xs text-white/40 font-body">
                  Drag or click "+" to add to your schedule
                </p>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-xs font-body px-3 py-1.5 rounded-full border transition-colors ${
                      categoryFilter === cat
                        ? 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow/40'
                        : 'bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Events list */}
              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {filteredEvents.map((event) => (
                  <DraggableSidebarEvent
                    key={event.id}
                    event={event}
                    onAdd={addToSchedule}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Drag overlay — shows a card following the cursor during drag */}
        <DragOverlay>
          {activeEvent ? <DragOverlayContent event={activeEvent} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
