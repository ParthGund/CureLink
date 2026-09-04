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
Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 2. Setup Dependencies
From the root workspace directory, run:
```bash
npm run install-all
```

### 3. Run the Client Dev Server
```bash
npm run client-dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
