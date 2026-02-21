/**
 * AI Concierge Page
 *
 * Chat interface powered by Featherless AI for personalized
 * Las Vegas recommendations, trip planning, and tips.
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useItinerary } from '../context/ItineraryContext'
import Logo from '../components/Logo'

const SUGGESTED_PROMPTS = [
  'What are the best free things to do in Vegas?',
  'Recommend a romantic dinner spot on the Strip',
  'Plan a 3-day Vegas itinerary for first-timers',
  'What shows are worth seeing right now?',
]

const API_URL = '/api/chat'
/**
 * Lightweight markdown renderer — handles bold, italic, inline code,
 * code blocks, headers, unordered/ordered lists, and line breaks
 * without any external dependencies.
 */
function renderMarkdown(text) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      elements.push(
        <pre
          key={elements.length}
          className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 my-2 overflow-x-auto text-xs leading-relaxed text-cyan-glow/90 font-mono"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Heading lines
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const cls =
        level === 1
          ? 'text-base font-semibold text-white mt-3 mb-1'
          : level === 2
            ? 'text-sm font-semibold text-white mt-2 mb-1'
            : 'text-sm font-medium text-white/90 mt-2 mb-0.5'
      elements.push(
        <p key={elements.length} className={cls}>
          {inlineMarkdown(headingMatch[2])}
        </p>
      )
      i++
      continue
    }

    // Unordered list item
    if (/^\s*[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 my-1.5 text-white/85">
          {items.map((item, idx) => (
            <li key={idx}>{inlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list item
    // Ordered list item
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = []
      
      // Extract the actual starting number from the AI's text (e.g., the "3" in "3. Go to the casino")
      const match = line.match(/^\s*(\d+)/)
      const startNum = match ? parseInt(match[1], 10) : 1

      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''))
        i++
      }
      elements.push(
        <ol key={elements.length} start={startNum} className="list-decimal list-inside space-y-1 my-1.5 text-white/85">
          {items.map((item, idx) => (
            <li key={idx}>{inlineMarkdown(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Blank line → spacer
    if (line.trim() === '') {
      elements.push(<div key={elements.length} className="h-2" />)
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} className="my-0.5 text-white/85">
        {inlineMarkdown(line)}
      </p>
    )
    i++
  }

  return elements
}

/** Render inline markdown: **bold**, *italic*, `code` */
function inlineMarkdown(text) {
  // Split on inline patterns, preserving delimiters
  const parts = []
  // Process bold, italic, and code in order of specificity
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[2]) {
      // **bold**
      parts.push(
        <strong key={parts.length} className="font-semibold text-white">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={parts.length} className="italic text-white/80">
          {match[3]}
        </em>
      )
    } else if (match[4]) {
      // `code`
      parts.push(
        <code
          key={parts.length}
          className="bg-white/10 text-cyan-glow/90 rounded px-1.5 py-0.5 text-xs font-mono"
        >
          {match[4]}
        </code>
      )
    }
    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

// PUT THIS OUTSIDE/ABOVE your Concierge component
const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY


export default function Concierge() {
  const { currentUser, logout } = useAuth()
  const { addStop } = useItinerary()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function sendMessage(text) {
    if (!text.trim() || loading) return

    const userMessage = text.trim()
    setInput('')

    // 1. Add user message to screen and turn on the 3 dots
    const currentChatHistory = [...messages, { role: 'user', content: userMessage }]
    setMessages(currentChatHistory)
    setLoading(true)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentChatHistory }), 
      })

      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let isFirstChunk = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break 
        
        const chunk = decoder.decode(value, { stream: true })
        assistantMessage += chunk

        if (isFirstChunk) {
          // 2. The AI started talking! Hide the dots and create the message box
          setLoading(false)
          isFirstChunk = false
          setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
        } else {
          // 3. Keep updating that message box with new words
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1].content = assistantMessage
            return newMessages
          })
        }
      }
    } catch (err) {
      console.error('Chat API error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into a problem connecting to the server.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleSuggestion(prompt) {
    sendMessage(prompt)
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-heading text-lg text-white tracking-wide">
              Viva Las Ventures
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="text-sm text-accent/80 hover:text-white transition-colors font-body"
            >
              ← Back to Home
            </Link>
            <button
              onClick={logout}
              className="text-sm text-white/40 hover:text-white transition-colors font-body"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ===== CHAT AREA ===== */}
      <main className="flex-1 pt-16 flex flex-col max-w-3xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {/* Welcome message if no messages yet */}
          {messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-cyan-glow/10 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-cyan-glow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-semibold text-white mb-3">
                AI Concierge
              </h2>
              <p className="text-white/50 font-body mb-8 max-w-md mx-auto">
                Hi {displayName}! I'm your personal Vegas assistant. Ask me
                about restaurants, shows, nightlife, day trips, or anything
                Las Vegas.
              </p>

              {/* Suggested prompts */}
              <div className="flex flex-wrap justify-center gap-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestion(prompt)}
                    className="text-sm bg-surface/60 border border-white/10 text-white/70 px-4 py-2.5 rounded-xl hover:border-cyan-glow/30 hover:text-white hover:bg-surface transition-all font-body"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              } animate-fade-in-up`}
              style={{ animationDelay: '0ms', animationDuration: '0.3s' }}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 font-body text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary/15 text-white border border-primary/20'
                    : 'bg-surface/80 text-white/90 border border-white/5'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-cyan-glow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                      />
                    </svg>
                    <span className="text-xs text-cyan-glow font-medium">
                      AI Concierge
                    </span>
                  </div>
                )}
                {/* Render messages — markdown for assistant, plain for user */}
                {msg.role === 'assistant' ? (
                  <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="bg-surface/80 border border-white/5 rounded-2xl px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-cyan-glow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                    />
                  </svg>
                  <span className="text-xs text-cyan-glow font-medium font-body">
                    AI Concierge
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-glow/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-glow/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-glow/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ===== INPUT BAR ===== */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-white/5 px-6 py-4">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 max-w-3xl mx-auto"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about restaurants, shows, activities..."
              disabled={loading}
              className="flex-1 bg-surface/60 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-5 py-3.5 outline-none focus:border-cyan-glow/40 focus:ring-2 focus:ring-cyan-glow/10 transition font-body text-sm disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-primary text-background font-semibold px-6 py-3.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:hover:bg-primary shrink-0"
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
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs text-white/20 font-body mt-2">
            Powered by Featherless AI — Responses may not always be accurate
          </p>
        </div>
      </main>
    </div>
  )
}
