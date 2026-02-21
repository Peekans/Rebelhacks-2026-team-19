/**
 * AI Concierge Page
 *
 * Full-screen chat interface for the Claude-powered Las Vegas travel assistant.
 * Handles:
 * - Sending/receiving messages via the Anthropic API
 * - Conversation history for context-aware responses
 * - Graceful error states when the API key is missing or invalid
 *
 * =========================================================================
 * API KEY REQUIRED:
 * This page requires a valid Anthropic API key in your .env file:
 *   VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
 *
 * Get a key at: https://console.anthropic.com/
 * =========================================================================
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { chatWithClaude, isApiKeyConfigured } from '../lib/anthropic'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const STARTER_SUGGESTIONS = [
  'What are the best shows on the Strip right now?',
  'Recommend a romantic dinner spot near the Bellagio',
  'What free things can I do in Las Vegas?',
  'Plan a one-day Vegas itinerary for a family',
]

export default function Concierge() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const apiKeyReady = isApiKeyConfigured()

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSend(messageText) {
    const text = (messageText || input).trim()
    if (!text || isLoading) return

    setInput('')
    setError(null)

    // Add user message
    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    // Build conversation history for API (exclude the latest user message since chatWithClaude adds it)
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setIsLoading(true)
    try {
      const reply = await chatWithClaude(text, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.'
      setError(msg)
      // Add error as a system message so user can see it inline
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: getErrorDisplay(msg), isError: true },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function getErrorDisplay(errorMsg) {
    if (errorMsg.includes('API_KEY_MISSING')) {
      return 'I\'m not connected yet. Please add your Anthropic API key to the .env file (VITE_ANTHROPIC_API_KEY) and restart the dev server.'
    }
    if (errorMsg.includes('INVALID_API_KEY')) {
      return 'My API key seems to be invalid or expired. Please check the VITE_ANTHROPIC_API_KEY value in your .env file.'
    }
    if (errorMsg.includes('RATE_LIMITED')) {
      return 'I\'m getting too many requests right now. Please wait a moment and try again.'
    }
    if (errorMsg.includes('NETWORK_ERROR')) {
      return 'I can\'t reach my servers right now. Please check your internet connection.'
    }
    return 'Something went wrong. Please try again in a moment.'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <Logo size={28} />
              <div>
                <h1 className="text-base font-heading font-semibold text-white">
                  AI Concierge
                </h1>
                <p className="text-xs text-white/40 font-body">
                  Powered by Claude
                </p>
              </div>
            </div>
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                apiKeyReady ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-white/40 font-body">
              {apiKeyReady ? 'Online' : 'API Key Missing'}
            </span>
          </div>
        </div>
      </nav>

      {/* ===== MESSAGES ===== */}
      <main className="flex-1 pt-20 pb-32 px-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Welcome message when no messages yet */}
          {messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-20 h-20 rounded-2xl bg-cyan-glow/10 text-cyan-glow flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-semibold text-white mb-3">
                Hey{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}! I'm Viva
              </h2>
              <p className="text-white/50 font-body max-w-md mx-auto mb-8">
                Your AI-powered Las Vegas concierge. Ask me anything about shows,
                restaurants, attractions, or help planning your perfect Vegas trip.
              </p>

              {!apiKeyReady && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 max-w-md mx-auto">
                  <p className="text-red-400 text-sm font-body">
                    <strong>API Key Required:</strong> Add your Anthropic API key to the{' '}
                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env</code>{' '}
                    file as{' '}
                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">
                      VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
                    </code>{' '}
                    and restart the dev server.
                  </p>
                </div>
              )}

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-3">
                {STARTER_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    disabled={isLoading}
                    className="text-sm text-white/70 bg-surface border border-white/10 rounded-full px-4 py-2 hover:border-cyan-glow/30 hover:text-white transition-all font-body"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 mb-6 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 text-cyan-glow flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 font-body text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary/20 text-white rounded-br-md'
                    : msg.isError
                    ? 'bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-md'
                    : 'bg-surface border border-white/5 text-white/90 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mt-1">
                  {(currentUser?.displayName || currentUser?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 text-cyan-glow flex items-center justify-center shrink-0 mt-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <div className="bg-surface border border-white/5 rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-cyan-glow/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-cyan-glow/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-glow/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ===== INPUT BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-white/5 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              apiKeyReady
                ? 'Ask about shows, restaurants, attractions...'
                : 'API key required — see setup instructions above'
            }
            disabled={isLoading}
            className="flex-1 bg-surface border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white font-body placeholder:text-white/30 focus:outline-none focus:border-cyan-glow/40 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-cyan-glow text-background font-semibold px-6 py-3.5 rounded-xl hover:bg-cyan-glow/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-body text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
