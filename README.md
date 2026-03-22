# 🏙️ Smart City Command & Control Platform

A comprehensive, centralized platform for managing smart city infrastructure using the MERN stack (MongoDB, Express, React, Node.js). 

This system provides real-time monitoring, prediction, and a complete **Role-Based Complaint Management System** for citizens and administrators.

## 🚀 Features Highlights
- **Real-time Analytics Dashboard** with overall City Health Score
- **Predictive AI Insights** based on trend analysis
- **Role-Based Complaint Management** (Citizen, Operator, Admin)
  - Citizens register and file complaints
  - Admins assign complaints with Smart AI routing (least-loaded matching operator)
  - Operators resolve their assigned complaints with trackable remarks
  - Enforced SLA deadlines and overdue alerts
- **Citizen Portal Gemini Assistant**
  - Smart chat support to guide complaint filing, category choice, and status tracking
- **Full Module Integration**: Traffic, Waste, Water, Lighting, Emergency
- **Activity Logging** for full audit trails
- **Dynamic Notifications & Alerts Panel**
- **Modern UI** with glassmorphism, responsive grid system, and interactive charts
- **Light / Dark Mode** support persisted via localStorage

---

## 🛠️ Step-by-Step Setup Instructions

### Prerequisites
Before running the application, make sure you have installed:
- **Node.js** (v16 or higher)
- **MongoDB** (running locally on `mongodb://localhost:27017` or use a MongoDB Atlas URI in `.env`)

### 1. Clone/Setup the Project
Ensure you are inside the `smart-city-platform` folder.

```bash
cd "smart-city-platform"
```

### 2. Configure Environment Variables
The `.env` file should be located at `backend/.env`. A default has already been created for you, but verify its contents:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart-city
JWT_SECRET=smartcity_secret_key_2024_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

### 3. Install Dependencies

**For Backend:**
```bash
cd backend
npm install
```

**For Frontend:**
```bash
cd frontend
npm install
```

### 4. Seed the Database
To populate the database with realistic sample data across all modules, including citizens and their complaints:
```bash
cd backend
npm run seed
```
> **Note:** Seeding automatically clears existing data and generates new users, alerts, incidents, locations, complaints, etc.

---

## 🏃‍♂ How to Run the Application

You need two separate terminal windows—one for the backend, one for the frontend.

### Terminal 1: Start the Backend Server
```bash
cd backend
npm run dev
```
*(Server will start on `http://localhost:5000`)*

### Terminal 2: Start the Frontend App
```bash
cd frontend
npm run dev
```
*(App will start on `http://localhost:5173`)*

---

## 🔑 Login Credentials

The `seed` script generates the following default users:

**1. Administrator (Full Access - Assigns complaints, views analytics):**
- **Email:** `admin@smartcity.com`
- **Password:** `admin123`

**2. Operators (Limited Access - Resolves assigned complaints):**
- **Traffic:** `traffic@smartcity.com` (password: `operator123`)
- **Waste:** `waste@smartcity.com` (password: `operator123`)
- **Water:** `water@smartcity.com` (password: `operator123`)
- **Emergency:** `emergency@smartcity.com` (password: `operator123`)

**3. Citizens (User Role - Files complaints):**
- **User 1:** `rahul@citizen.com` (password: `citizen123`)
- **User 2:** `priya@citizen.com` (password: `citizen123`)
*Note: You can also use the Registration terminal to create a new Citizen account instantly.*

---

## 📂 Folder Structure

```
smart-city-platform/
│
├── backend/                  # Node.js + Express
│   ├── models/               # MongoDB Schemas (Complaint, User, etc.)
│   ├── routes/               # API endpoints
│   ├── seed/                 # Sample Data Generator
│   └── server.js             
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── context/          # AuthContext & ThemeContext
    │   ├── pages/            # Login, Dashboard, Complaints, etc.
    │   ├── index.css         # Global Styles (Light/Dark Variables)
    │   └── App.jsx           # Protected Role-Based Routes
```

---

Developed for smart city scale management. Strict RBAC handling and automated lifecycle SLA tracking.
