# Viva Las Ventures

**Viva Las Ventures** is an AI-powered Las Vegas itinerary planner that helps locals and tourists discover live events and things-to-do in Las Vegas!

---

## Features

- AI-generated recommendations for a tailored experience  
- Live event discovery via the TicketMaster API  
- User authentication with Firebase Auth  
- Cloud data storage using Firestore  
- One-click itinerary building experience  

---

## Getting Started

### Prerequisites

#### Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- A Firebase Project (with Auth and Firestore enabled)
- An AI API Key from Featherless AI
- A Ticketmaster Discovery API Key

#### Clone the Repository

git clone https://github.com/your-username/your-repo-name.git cd your-repo-name

#### Set Up Environment Variables

You will need to create two .env files—one for the frontend and one for the backend.

#### Frontend (/frontend/.env):

Create a .env file in your frontend directory and add your Firebase and Ticketmaster credentials. (Note: If using Vite, prefix with VITE_. If using Create React App, prefix with REACT_APP_)

VITE_FIREBASE_API_KEY="your_firebase_api_key"

VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"

VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"

VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"

VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"

VITE_FIREBASE_APP_ID="your_firebase_app_id"

VITE_TICKETMASTER_KEY="your_ticketmaster_key"

FEATHERLESS_API_KEY="your_featherless_key"

#### Backend (/backend/.env):

Create a .env file in your backend directory for your AI integration.

Code snippet

PORT=3001

VITE_TICKETMASTER_KEY="your_ticketmaster_key"

FEATHERLESS_API_KEY="your_featherless_key"

#### Install Dependencies & Run the Backend
Open a terminal, navigate to the backend folder, install the packages, and start the Express server.

cd backend

npm install

node server.js

The server should now be running on http://localhost:3001

#### Install Dependencies & Run the Frontend
Open a new terminal window, navigate to the frontend folder, install the packages, and start the React development server.

cd frontend

npm install

npm run dev

The app should now be running on http://localhost:5173 (or 3000)

---

## Tech Stack

- **React** (Vite) — fast, modern frontend tooling
- **Firebase** — Auth (email/password + Google), Firestore database
- **Tailwind CSS** — utility-first styling with custom Vegas-themed palette
- **React Router v6** — client-side routing
- **Featherless AI API** — AI chatbot for trip planning
- **Ticketmaster Discovery API** — live Las Vegas events and shows