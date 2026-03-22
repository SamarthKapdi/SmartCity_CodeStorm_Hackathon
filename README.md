# Smart City Command and Control Platform

> A full-stack civic operations platform to monitor city services, manage incidents, and resolve citizen complaints with role-based workflows and AI-assisted support.

![License](https://img.shields.io/badge/license-MIT-green)
![MERN](https://img.shields.io/badge/stack-MERN-blue)
![Realtime](https://img.shields.io/badge/realtime-WebSocket-orange)
![RBAC](https://img.shields.io/badge/security-RBAC-critical)

## Why This Project Stands Out

- Unified command center for traffic, water, waste, lighting, incidents, and alerts.
- Built-in RBAC for Admin, Operator, and Citizen journeys.
- Smart complaint lifecycle with assignment and SLA-style tracking.
- Live dashboard experience with modern, responsive UI.
- AI-powered citizen assistant with robust fallback handling.

## Core Capabilities

### Governance and Workflows
- Secure authentication with JWT.
- Role-restricted modules and actions.
- Activity logs for auditability and accountability.

### Civic Operations
- Traffic monitoring and incident support.
- Waste collection operations and route intelligence.
- Water system monitoring and analytics.
- Lighting fault reporting and control.
- Emergency and incident management with alerting.

### Citizen Experience
- Citizen complaint filing and status tracking.
- Guided support through chat assistant.
- Public announcement feed and city alerts.

## Architecture Overview

```text
Frontend (React + Vite)
  -> REST API + Socket Client
Backend (Node.js + Express + Socket.io)
  -> Business Logic + RBAC + Validation
MongoDB (Mongoose Models)
  -> Complaints, Alerts, Logs, Users, City Modules
```

## Tech Stack

- Frontend: React, React Router, Axios, Recharts, Socket.io Client
- Backend: Node.js, Express, Mongoose, JWT, Joi, Socket.io
- Database: MongoDB
- AI: Google Gemini API integration

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB local or Atlas URI

### 2. Clone and Install

```bash
git clone https://github.com/SamarthKapdi/SmartCity_CodeStorm_Hackathon.git
cd SmartCity_CodeStorm_Hackathon

cd backend && npm install
cd ../frontend && npm install
```

### 3. Backend Environment

Create `backend/.env` with:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart-city
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

### 4. Seed Demo Data (Optional)

```bash
cd backend
npm run seed
```

### 5. Run the App

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

App URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Demo Credentials

Admin:
- Email: `admin@smartcity.com`
- Password: `admin123`

Operators:
- `traffic@smartcity.com` / `operator123`
- `waste@smartcity.com` / `operator123`
- `water@smartcity.com` / `operator123`
- `emergency@smartcity.com` / `operator123`

Citizens:
- `rahul@citizen.com` / `citizen123`
- `priya@citizen.com` / `citizen123`

## Project Structure

```text
SmartCity_CodeStorm_Hackathon/
  backend/
    config/        # DB and server configuration
    middleware/    # Auth, validation, role checks, error handling
    models/        # Mongoose schemas
    routes/        # API route modules
    services/      # AI and domain logic
    seed/          # Seed scripts
    server.js

  frontend/
    src/
      components/  # Shared UI components
      context/     # Auth/theme/toast context
      pages/       # Module pages and dashboards
      services/    # API/socket clients
```

## API Glimpse

- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/complaints`
- `POST /api/complaints`
- `POST /api/chat/assistant`
- `GET /api/alerts`

## Security and Reliability Notes

- Never commit real API keys or secrets.
- Rotate `GEMINI_API_KEY` if it was exposed.
- AI assistant includes fallback behavior for model/quota issues to keep UX stable.

## Roadmap Ideas

- Add integration tests for key complaint workflows.
- Add CI pipeline with lint and build checks.
- Add deployment profiles for Render or Railway plus Mongo Atlas.
- Add maps and geo-fencing for incident heat zones.

## License

MIT
