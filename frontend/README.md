# CodeSync — Frontend

Modern, high-performance client interface for **CodeSync**, a real-time collaborative development environment. Built with React 19, Vite, TailwindCSS, Monaco Editor, Framer Motion, and Yjs CRDT synchronization.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) (VS Code browser engine)
- **Real-Time Collaboration**: [Yjs](https://yjs.dev/) + [y-websocket](https://github.com/yjs/y-websocket) + [y-monaco](https://github.com/yjs/y-monaco)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/) + Custom Glassmorphism UI
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) with automatic token refresh interceptor & failed queue replay

---

## 📂 Project Structure

```text
src/
├── assets/          # Static branding, hero images, and vectors
├── components/
│   ├── layout/      # Navbar, PageTransition wrappers
│   ├── ui/          # Reusable design tokens (Button, Input, Modal, Badge, Spinner)
│   └── workspace/   # IDE panels (EditorTabs, FileExplorer, OutputPanel, ChatPanel)
├── contexts/        # AuthContext (JWT management, silent refresh, OAuth handoff)
├── pages/
│   ├── Home.jsx         # Landing page highlighting features & local execution
│   ├── Login.jsx        # User login with GitHub OAuth option
│   ├── Register.jsx     # Registration with email verification flow
│   ├── Dashboard.jsx    # Workspaces and project management
│   ├── Workspace.jsx    # The core collaborative IDE interface
│   └── AuthCallback.jsx # Secure single-use OAuth code exchange handoff
└── utils/
    └── api.js       # Configured Axios instance with refresh interceptor
```

---

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:5000/api/v1/collaboration
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

---

## 🔒 Security & Collaboration Features

- **No JWT in URLs**: GitHub OAuth utilizes a temporary one-time authorization code exchange processed via `AuthCallback.jsx` and `POST /api/v1/auth/oauth/exchange`.
- **Silent Refresh**: Refresh token stored in secure `httpOnly` cookie; access token maintained in memory.
- **Role-Based Workspace**: Monaco editor automatically locks to `readOnly` mode when viewing projects with `VIEWER` access.
- **Awareness & Presence**: Real-time cursor coordinates and user indicators broadcasted through Yjs awareness protocol.
