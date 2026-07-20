# CodeSync

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)
![Node](https://img.shields.io/badge/Node-v18+-green.svg)

CodeSync is a powerful, real-time collaborative IDE designed for teams. It features a robust Virtual File System (VFS), an integrated execution engine, and multiplayer synchronization powered by Yjs, enabling developers to code, chat, and build together in perfect harmony.

## ✨ Features

- **Real-Time Collaboration**: Code together with zero latency using Operational Transformation (OT) via Yjs and WebSockets.
- **Virtual File System (VFS)**: A highly optimized PostgreSQL-backed file system allowing seamless file/folder management, just like VSCode.
- **In-Browser Execution Engine**: Run code securely right inside the browser using Docker/Piston API integration (supports JS, Python, C++, etc.).
- **Live Team Chat**: Built-in chat channel synchronized in real-time alongside your code workspace.
- **Stunning UI/UX**: Designed with a sleek, modern, glassmorphic aesthetic utilizing Tailwind CSS and Framer Motion.
- **Role-Based Access Control**: Owners, Editors, and Viewers can manage workspaces and projects securely.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS & Framer Motion
- **Editor**: Monaco Editor (VSCode Engine)
- **Collaboration**: Yjs, y-monaco, y-websocket
- **Routing & State**: React Router, Context API, Axios

### Backend
- **Server**: Node.js & Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Real-Time Layer**: Native WebSockets (`ws`) with Yjs Persistence
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **Validation**: express-validator

## 🏗 Architecture Overview

CodeSync follows a scalable client-server architecture:
- The **Express Backend** serves a REST API for authentication, project management, and VFS file persistence.
- The **WebSocket Server** runs concurrently, intercepting upgrade requests to authenticate users, and maintaining Yjs document synchronizations for real-time code editing and chat.
- The **PostgreSQL Database** stores all persistence data. The WebSocket layer actively debounces and saves code changes to the database to ensure no data is lost when all clients disconnect.

```mermaid
graph TD
    subgraph Client ["Client (React / Vite)"]
        UI["Workspace UI"]
        Editor["Monaco Editor"]
        Collab["Yjs Client"]
    end

    subgraph Server ["Server (Node.js)"]
        API["Express REST API"]
        WS["WebSocket Server (Yjs)"]
    end

    subgraph Data ["Database"]
        DB[("PostgreSQL")]
    end

    subgraph External ["External Services"]
        Piston["Piston Execution Engine"]
    end

    UI -- "HTTP (VFS, Auth)" --> API
    Editor <== "Sync" ==> Collab
    Collab <== "WebSockets" ==> WS
    
    API -- "Prisma" --> DB
    WS -- "Debounced Save" --> DB
    
    API -- "Run Code" --> Piston
```

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or via a cloud provider)

## 💻 Local Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/CodeSync.git
cd CodeSync
```

**2. Setup the Backend**
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/codesync?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
CLIENT_URL="http://localhost:5173"
PISTON_URL="https://emkc.org/api/v2/piston"
```
Run Prisma migrations to initialize the database:
```bash
npx prisma migrate dev --name init
```
Start the backend development server:
```bash
npm run dev
```

**3. Setup the Frontend**
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:5000/api/v1"
```
Start the frontend development server:
```bash
npm run dev
```

**4. Open the App**
Navigate to `http://localhost:5173` in your browser. Register a new account, create a workspace, and start coding!

## 🤝 Contributing

Contributions are welcome! If you'd like to improve CodeSync, please fork the repository and create a pull request with your features or bug fixes.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
