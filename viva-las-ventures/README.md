# Viva Las Ventures

A Las Vegas itinerary planner for locals and tourists.

## Tech Stack

- **React** (Vite) — fast, modern frontend tooling
- **Firebase** — Auth (email/password + Google), Firestore database, Hosting
- **Tailwind CSS** — utility-first styling with custom Vegas-themed palette
- **React Router v6** — client-side routing
- **@dnd-kit** — drag-and-drop itinerary reordering
- **Anthropic Claude API** (claude-sonnet-4-6) — AI chatbot for trip planning
- **Ticketmaster Discovery API** — live Las Vegas events and shows

## Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd viva-las-ventures
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Fill in your API keys in `.env`:
   - **Firebase**: Create a project at [Firebase Console](https://console.firebase.google.com), enable Email/Password and Google sign-in under Authentication
   - **Anthropic**: Get an API key at [Anthropic Console](https://console.anthropic.com)
   - **Ticketmaster**: Get an API key at [Ticketmaster Developer Portal](https://developer.ticketmaster.com)

5. Start the development server:
   ```bash
   npm run dev
   ```

## Features

<!-- TODO: Add feature descriptions as they are built -->

## Screenshots

<!-- TODO: Add screenshots -->

## Contributing

<!-- TODO: Add contributing guidelines -->
