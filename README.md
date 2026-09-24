# CureLink

CureLink is a MERN-based healthcare web application for managing appointments, consultations, medical records, communication, and healthcare administration.

The system supports three primary roles:
- **Patient**
- **Doctor**
- **Administrator**

---

## Project Structure

```text
CureLink/
│
├── client/          # Frontend React Application (Vite)
├── server/          # Backend Express Server
├── docs/            # Architectural & API Documentation
└── package.json     # Root package file for managing workspace scripts
```

For more details on coding rules and philosophy, refer to [AGENTS.md](file:///d:/CureLink/AGENTS.md).

---


## Quick Start

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v20+ recommended).

### 2. Environment Configuration
Create a `.env` file in the root directory based on `.env.example` (or configure your own MongoDB instance):
```bash
cp .env.example .env
```
Ensure `MONGO_URI` is set to your MongoDB connection string.

### 3. Setup Dependencies
From the root workspace directory, run:
```bash
npm run install-all
```

### 4. Bootstrap an Admin Account
To manage the platform, you must first create an administrator account:
```bash
cd server
npm run create:admin
```
Follow the interactive prompts to set your admin credentials.

### 5. Run the Application
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run server-dev
```
The server runs on [http://localhost:5000](http://localhost:5000).

**Terminal 2 (Frontend Client):**
```bash
npm run client-dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
