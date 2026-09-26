# CodeSync

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node-v18%2B-green.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)

CodeSync is a browser-based collaborative development environment for working on code together in real time. It combines a React/Vite frontend, a Node.js/Express modular-monolith backend, PostgreSQL persistence through Prisma, and a WebSocket/Yjs collaboration layer.

The application provides authentication, workspaces, projects, a PostgreSQL-backed virtual file system, collaborative editing, project chat, role-based project access, and local JavaScript/Python code execution.

> **Implementation note:** This README describes the current codebase. Code execution currently runs locally through Node.js `child_process` with a 5-second timeout; it is **not** currently isolated in Docker/Piston or another sandbox.

---

## ✨ Features

- **Real-time collaborative editing** using Yjs, `y-websocket`, native WebSockets, and Monaco Editor.
- **CRDT-based synchronization** through Yjs. CodeSync does not implement classic Operational Transformation (OT).
- **Virtual File System (VFS)** with projects, folders, nested folders, files, file content, and language metadata stored in PostgreSQL.
- **Project collaboration** with `OWNER`, `EDITOR`, and `VIEWER` roles.
- **Project chat** synchronized through a Yjs project document and persisted to PostgreSQL.
- **Authentication** with local email/password authentication, JWT access tokens, refresh tokens, and GitHub OAuth.
- **Secure refresh-token cookie** using HTTP-only, Secure-in-production, SameSite=Strict cookie settings.
- **Email workflows** for email verification and password reset.
- **REST API** for authentication, users, workspaces, projects, VFS operations, execution, and health checks.
- **Request protection** with Helmet, CORS, rate limiting, validation, and structured error handling.
- **WebSocket connection throttling** with a per-IP connection-attempt limit.
- **Swagger/OpenAPI support** through `swagger-jsdoc` and `swagger-ui-express`.
- **Developer tooling** with ESLint, Prettier, Husky, lint-staged, Prisma migrations, and Prisma Studio.

---

## 🏗 Architecture

CodeSync uses a **modular monolith** for the backend. Domain-specific modules are separated inside one Node.js/Express application, while real-time collaboration is handled through a native WebSocket server attached to the same HTTP server.

### High-level architecture

```mermaid
flowchart TD
    Browser["Browser<br/>React + Vite"]

    subgraph Frontend["Frontend"]
        UI["Workspace UI"]
        Monaco["Monaco Editor"]
        YClient["Yjs Client<br/>Y.Doc / Y.Text"]
        Axios["Axios REST Client"]
    end

    subgraph Backend["Backend - Node.js"]
        Express["Express REST API"]
        Auth["Auth / Authorization"]
        VFS["VFS / Projects / Workspaces"]
        WS["Native WebSocket Server<br/>ws + y-websocket"]
        Execution["Execution Controller"]
    end

    DB[("PostgreSQL<br/>Prisma")]

    GitHub["GitHub OAuth"]
    LocalRuntime["Local Node.js / Python Runtime"]

    Browser --> UI
    UI --> Monaco
    UI --> Axios
    Monaco <--> YClient

    Axios --> Express
    Express --> Auth
    Express --> VFS
    Auth --> DB
    VFS --> DB

    YClient <-->|"WebSocket / Yjs updates"| WS
    WS --> DB

    Express --> Execution
    Execution --> LocalRuntime

    Auth <-->|"OAuth"| GitHub
```

### Two communication paths

CodeSync deliberately separates **durable resource operations** from **real-time collaborative state**:

1. **REST/HTTP**
   - Authentication
   - Workspaces
   - Projects
   - Project membership
   - Files and folders
   - File content
   - Code execution
   - Other normal request/response operations

2. **WebSocket + Yjs**
   - Collaborative editor state
   - Yjs synchronization
   - Presence/awareness supported by the Yjs WebSocket stack
   - Project chat state
   - Real-time propagation of document updates

This avoids using HTTP requests for every editor change while keeping normal CRUD operations simple and resource-oriented.

---

## 🔄 Collaborative Editing Flow

A simplified editing flow is:

```text
Monaco Editor
    ↓
y-monaco binding
    ↓
Y.Text inside Y.Doc
    ↓
Yjs generates a CRDT update
    ↓
WebSocket
    ↓
y-websocket server
    ↓
Other clients' Y.Doc
    ↓
Other Monaco Editors
```

For persistence, the server maps collaborative documents to database records:

- A file collaboration document uses the file ID as the document name.
- A project collaboration document uses the `project-<projectId>` convention for project chat.
- Existing PostgreSQL state is loaded into the Yjs document when the document is initialized.
- Yjs state is written back to PostgreSQL through persistence callbacks.
- An additional two-minute autosave loop persists active documents.

### Important terminology

Yjs is based on **CRDTs (Conflict-free Replicated Data Types)** rather than classic OT. Multiple clients can make changes concurrently, and Yjs synchronizes the resulting document state so replicas converge.

---

## 🗂 Virtual File System

The VFS is relational rather than an actual operating-system filesystem.

The database models:

```text
Project
 ├── Folder
 │    ├── Folder
 │    │    └── File
 │    └── File
 └── File
```

Folders use a self-referencing relationship:

- `Folder.parentId` points to another folder.
- A folder can have many child folders.
- Files optionally belong to a folder.
- Files and folders belong to a project.
- Database-level composite uniqueness prevents duplicate names within the same project/parent scope.

The backend exposes VFS operations for creating, reading, updating, renaming, and deleting files and folders.

---

## 🔐 Authentication & Authorization

### Authentication

The backend supports:

- Local registration/login
- JWT access tokens
- Refresh tokens
- Refresh-token persistence in PostgreSQL
- Refresh-token cookie handling
- GitHub OAuth
- Email verification
- Forgot-password/reset-password workflows
- Session logging for login/logout events

The login flow returns an access token to the client while the refresh token is stored in an HTTP-only cookie.

Refresh tokens are persisted in the `RefreshToken` table and associated with a user.

### Authorization

Project access is resource-based.

Project roles are:

| Role | Typical permissions |
|---|---|
| OWNER | Full project management |
| EDITOR | Modify project resources |
| VIEWER | Read-only access |

The VFS service checks project access before performing operations and blocks write operations for viewers.

Public projects can also be accessed according to the authorization logic implemented by the backend.

---

## 🧩 Backend Structure

The backend follows a modular-monolith structure:

```text
backend/
└── src/
    ├── config/
    ├── lib/
    ├── middlewares/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── workspaces/
    │   ├── projects/
    │   ├── vfs/
    │   ├── execution/
    │   └── health/
    ├── utils/
    ├── app.js
    ├── server.js
    └── socket.js
```

The typical request path is:

```text
HTTP Request
    ↓
Express Router
    ↓
Authentication / Validation Middleware
    ↓
Controller
    ↓
Service / Business Logic
    ↓
Prisma Client
    ↓
PostgreSQL
    ↓
HTTP Response
```

This keeps HTTP concerns separate from business logic and database access.

---

## 🗄 Database Model

PostgreSQL is accessed through Prisma ORM.

The main models currently include:

- `User`
- `RefreshToken`
- `Workspace`
- `Project`
- `ProjectMember`
- `Folder`
- `File`
- `SessionLog`

Important relationships include:

```text
User
 ├── Workspaces
 ├── ProjectMemberships
 ├── RefreshTokens
 └── SessionLogs

Workspace
 └── Projects

Project
 ├── ProjectMembers
 ├── Folders
 └── Files

Folder
 ├── Child Folders
 └── Files
```

The schema also uses foreign keys, cascading deletes, unique constraints, and composite unique constraints.

---

## ▶️ Code Execution

Code execution is implemented by the backend execution module.

Current flow:

```text
Client
  ↓
Execution REST endpoint
  ↓
Verify project access
  ↓
Obtain source code
  ├── request body
  └── PostgreSQL file
  ↓
Create temporary source file
  ↓
child_process.exec()
  ├── Node.js for JavaScript
  └── Python for Python
  ↓
5-second execution timeout
  ↓
Capture stdout / stderr / exit code
  ↓
Delete temporary file
  ↓
Return result
```

### Currently supported languages

- JavaScript
- Python

C/C++/Java compilation is not currently implemented by the local execution controller.

### Security limitation

The current implementation executes submitted code on the backend host using `child_process.exec`. A production-grade implementation should isolate untrusted code using a sandbox/container/worker architecture with controls for CPU, memory, filesystem, network access, process count, and execution time.

---

## 🔌 WebSocket Layer

The backend creates a native `ws` WebSocket server using `noServer: true` and intercepts HTTP upgrade requests.

The collaboration endpoint follows the pattern:

```text
/api/v1/collaboration/<document-name>
```

Before the WebSocket upgrade:

1. The request is inspected.
2. An access token is read from the `token` query parameter.
3. The JWT is verified.
4. The user is loaded from PostgreSQL.
5. The connection is upgraded only after successful authentication.
6. The connection is handed to the Yjs WebSocket synchronization layer.

The server also applies a basic per-IP connection-attempt limit.

> **Security consideration:** Passing an access token in a URL query parameter can expose tokens through logs or other URL-observing infrastructure. A production hardening pass should use a safer WebSocket authentication mechanism where possible.

---

## 🧰 Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Monaco Editor
- Yjs
- y-monaco
- y-websocket
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express 5
- Native WebSockets via `ws`
- y-websocket
- Yjs
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs
- express-validator
- express-rate-limit
- Helmet
- CORS
- Morgan
- Nodemailer
- Swagger / OpenAPI tooling

### Developer tooling

- ESLint
- Prettier
- Husky
- lint-staged
- Nodemon
- Prisma migrations
- Prisma Studio

---

## 📁 Repository Structure

```text
CodeSync/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── execution/
│   │   │   ├── health/
│   │   │   ├── projects/
│   │   │   ├── users/
│   │   │   ├── vfs/
│   │   │   └── workspaces/
│   │   ├── utils/
│   │   ├── app.js
│   │   ├── server.js
│   │   └── socket.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
│
└── README.md
```

---

## 🛠 Prerequisites

Install:

- Node.js 18+
- PostgreSQL
- npm

A PostgreSQL database can be local or hosted.

---

## 🚀 Local Setup

### 1. Clone

```bash
git clone https://github.com/Taarun8431/CodeSync.git
cd CodeSync
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` with the values required by your local configuration. At minimum, the application requires a PostgreSQL `DATABASE_URL` and the JWT configuration used by the authentication module.

Example:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://user:password@localhost:5432/codesync?schema=public"

JWT_ACCESS_SECRET="your_access_token_secret"
JWT_REFRESH_SECRET="your_refresh_token_secret"

CLIENT_URL="http://localhost:5173"

GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="http://localhost:5000/api/v1/auth/github/callback"
```

Install/generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

The backend development server runs on the configured port, which is `5000` in the example above.

### 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:5000/api/v1"
```

Start Vite:

```bash
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

---

## 📜 Available Backend Scripts

From `backend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server with Nodemon |
| `npm start` | Start production-style Node server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format backend source |
| `npm run format:check` | Check formatting |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the development database |

From `frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build the frontend |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build |

---

## 🔒 Production Considerations

The current repository is a functional collaborative-development project, but several areas should be hardened before treating it as an untrusted public production service:

- Move code execution into isolated containers or sandboxed workers.
- Do not expose access tokens through WebSocket URLs.
- Add stronger WebSocket/document-level authorization checks.
- Add CPU, memory, filesystem, network, and process limits for code execution.
- Introduce a dedicated execution queue/worker architecture for untrusted workloads.
- Consider shared real-time infrastructure when horizontally scaling WebSocket servers.
- Add stronger observability around collaboration, execution, authentication, and database failures.
- Review rate limits and abuse controls for public deployments.
- Add automated integration/security tests around authorization boundaries.

These are architectural hardening opportunities rather than claims about functionality that is already implemented.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run linting/formatting and relevant tests.
5. Open a pull request with a clear description of the change.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
