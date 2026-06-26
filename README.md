# 🏢 IT Asset Management (ITAM) & Ticketing System

A modern, fast, and feature-rich IT Asset Management and Helpdesk Ticketing System. Built with Next.js 14, React, SQLite, and styled with premium glassmorphism aesthetics.

---

## ✨ Key Features

- **Dashboard Analytics**: Real-time overview of ticket status and asset distribution.
- **Helpdesk Ticketing**: Robust ticket management with full CRUD, file attachments, conversation threads, and status timelines.
- **Asset Management**: Track hardware and software assets, assign them to employees, and monitor their status (In Use, Available, Maintenance).
- **Employee Directory**: Manage employee data and deeply link their profiles to both assets and support tickets.
- **Modern UI/UX**: Premium, responsive interface featuring gradient cards, glassmorphism, animated transitions, and interactive chat bubbles.
- **Role-Based Access**: Secure login system separating standard users from administrators.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Frontend**: React, standard CSS modules for highly customized styling.
- **Backend API**: Next.js API Routes (Serverless functions)
- **Database**: SQLite (via `sqlite` and `sqlite3` packages)
- **Authentication**: JWT-based custom auth

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18.x or newer)
- **npm** (Node Package Manager)
- Git (optional, for cloning)

### 2. Getting the Code
Open your terminal and clone the repository (or extract the project folder):
```bash
git clone <YOUR-GITHUB-REPO-URL>
cd it-asset-management-main/web
```

### 3. Install Dependencies
Run the following command inside the `web` folder to install all required packages:
```bash
npm install
```

### 4. Database Setup
The application uses SQLite as its database. To set up the schema and seed the initial data:
```bash
node scripts/init-db.js
```
*(This will generate a `database.sqlite` file in the root directory containing all necessary tables and the default Admin account).*

### 5. Running the Application (Development Mode)
Start the Next.js development server:
```bash
npm run dev
```
- Open your browser and navigate to: `http://localhost:3000`
- **Default Admin Login**:
  - Email: `admin@example.com`
  - Password: `admin`

### 6. Building for Production
When you are ready to deploy the app to a production environment:

1. Create an optimized production build:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

---

## 📂 Project Structure

```text
web/
├── public/              # Static assets (images, uploads)
├── scripts/
│   └── init-db.js       # Database initialization script
├── src/
│   ├── app/             # Next.js App Router (Pages & API endpoints)
│   │   ├── api/         # Backend API Routes (REST)
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── tickets/     # Ticketing UI
│   │   ├── assets/      # Asset management UI
│   │   └── employees/   # Employee management UI
│   └── components/      # Reusable React components (Sidebar, Modals, etc.)
├── database.sqlite      # SQLite database file (auto-generated)
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

---

## 🐛 Known Behaviors & "Bug-Free" Guidelines
This application has been heavily optimized for stability.
- **Deleting Employees**: Deleting an employee will *not* delete their tickets. Instead, the tickets become "Guest" tickets, but the system preserves the deleted employee's original Name and Email in the description to ensure no audit trail is lost.
- **Ticket Comments**: Comment avatars safely fallback to "U" (User) if a profile lacks a name, preventing runtime crashes.
- **File Uploads**: The entire attachment card is clickable. Deleting an attachment requires Admin privileges.

---

## 🤝 Contributing
1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
*Developed with ❤️ for efficient IT Operations.*
