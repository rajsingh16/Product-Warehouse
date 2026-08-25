# Project Warehouse

A modern full-stack-ready web application for managing projects, employees, folders, and project-related files.

## Setup Instructions

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build for Production

```bash
npm run build
npm run preview
```

## Demo Login Credentials

| User ID | Password  | Name        | Role            |
|---------|-----------|-------------|-----------------|
| admin   | admin123  | Raj Singh   | Administrator   |
| john    | john123   | John Doe    | Project Manager |
| sarah   | sarah123  | Sarah Smith | Team Lead       |

## Demo OTP

After successful login, enter:

```
123456
```

The OTP is also logged to the browser console during development.

## Project Structure

```
src/
├── components/
│   ├── auth/           # Protected route wrapper
│   ├── common/         # Button, Modal, Toast, ConfirmDialog
│   ├── files/          # File table, upload, preview, icons
│   ├── layout/         # Header, Sidebar, Breadcrumbs, Layout
│   └── projects/       # Project search, table, form, folder cards
├── context/            # Auth and Toast providers
├── data/               # Mock/static data
├── pages/              # Route-level page components
├── services/           # API-ready service layer (currently mocked)
├── types/              # TypeScript interfaces
├── App.tsx             # Router configuration
└── main.tsx            # Application entry point
```

## Features

- Mock authentication with WhatsApp OTP simulation
- Protected routes with localStorage session persistence
- Project CRUD (create, read, update, delete)
- Employee search and detail views
- Folder navigation with file upload, preview, download, and delete
- Dynamic project search with autocomplete
- Responsive sidebar and enterprise-style UI
- Toast notifications and confirmation dialogs

## Future Backend API Integration

Replace mock implementations in `src/services/` with real HTTP calls:

| Service | Future Endpoints |
|---------|------------------|
| `authService.ts` | `POST /api/auth/login`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp` |
| `projectService.ts` | `GET/POST/PUT/DELETE /api/projects` |
| `fileService.ts` | `GET/POST/DELETE /api/projects/:id/folders/:id/files` |
| `employeeService.ts` | `GET /api/employees`, `GET /api/employees/:id` |

## WhatsApp OTP Integration

Add in `authService.ts` after credential validation:

1. Backend retrieves the user's WhatsApp number from the database
2. Backend generates and stores OTP (hashed, with expiry)
3. Backend sends OTP via WhatsApp Business API
4. Frontend receives only masked phone digits (e.g. ending in **45)
5. `verifyOTP()` calls `POST /api/auth/verify-otp`

## Database Layer

Recommended entities: `users`, `employees`, `projects`, `project_assignments`, `folders`, `files`.

Replace `localStorage` persistence in services with API calls. Mock data in `src/data/mockData.ts` maps directly to seed data for development.

## Security Notes (Production)

- Hash passwords with bcrypt/Argon2 — never store plain text
- Use JWT or secure session cookies instead of localStorage for auth tokens
- Validate file types server-side (not just extensions)
- Enforce authorization server-side for projects and files
