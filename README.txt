================================================================
  TASKFLOW - TEAM TASK MANAGER
  Full-Stack Assignment | Ethara.AI
================================================================

LIVE URL: team-task-manager-git-main-harikaragiris-projects.vercel.app
GITHUB:   https://github.com/harikaragiri/team-task-manager

----------------------------------------------------------------
PROJECT OVERVIEW
----------------------------------------------------------------
TaskFlow is a full-stack Team Task Manager web application
built with React (frontend) and Node.js/Express (backend),
using MongoDB as the database.

----------------------------------------------------------------
TECH STACK
----------------------------------------------------------------
Frontend:
  - React 18 with React Router v6
  - Axios for HTTP requests
  - Custom CSS (no external UI libraries)

Backend:
  - Node.js + Express.js
  - MongoDB + Mongoose ODM
  - JWT Authentication
  - express-validator for input validation
  - bcryptjs for password hashing

Deployment:
  - Railway.app (full-stack deployment)
  - MongoDB Atlas (cloud database)

----------------------------------------------------------------
KEY FEATURES
----------------------------------------------------------------
1. AUTHENTICATION
   - User registration with name, email, password, role
   - Secure login with JWT tokens (7-day expiry)
   - Protected routes (frontend + backend)
   - Role selection: Admin / Member

2. PROJECT MANAGEMENT
   - Create projects with name, description, deadline, color
   - View all projects in a card grid
   - Admin can add/remove team members
   - Project status: active, completed, archived

3. TASK MANAGEMENT
   - Create, edit, delete tasks within projects
   - Kanban board view per project (4 columns)
   - Task list view with filtering
   - Assign tasks to project members
   - Status: todo / in-progress / review / done
   - Priority: low / medium / high / urgent
   - Due dates with overdue detection
   - Tags support

4. DASHBOARD
   - Stats: total tasks, in-progress, overdue, completed
   - Progress bars by status
   - Recent tasks assigned to you

5. ROLE-BASED ACCESS CONTROL
   - Admin: create projects, add members, delete tasks
   - Member: view projects, create/edit own tasks
   - Project-level access control
   - API-level authorization on every endpoint

6. TEAM PAGE
   - View all registered users
   - Shows roles and join dates

----------------------------------------------------------------
API ENDPOINTS
----------------------------------------------------------------
Auth:
  POST /api/auth/register    - Register user
  POST /api/auth/login       - Login
  GET  /api/auth/me          - Get current user
  GET  /api/auth/users       - List all users

Projects:
  GET    /api/projects          - List user's projects
  POST   /api/projects          - Create project
  GET    /api/projects/:id      - Get project details
  PUT    /api/projects/:id      - Update project
  DELETE /api/projects/:id      - Delete project
  POST   /api/projects/:id/members     - Add member
  DELETE /api/projects/:id/members/:uid - Remove member

Tasks:
  GET    /api/tasks             - List tasks (with filters)
  POST   /api/tasks             - Create task
  GET    /api/tasks/:id         - Get task
  PUT    /api/tasks/:id         - Update task
  DELETE /api/tasks/:id         - Delete task
  GET    /api/tasks/dashboard/stats - Dashboard stats

----------------------------------------------------------------
HOW TO RUN LOCALLY
----------------------------------------------------------------

PREREQUISITES:
  - Node.js v18+ (download from nodejs.org)
  - MongoDB Atlas account (free at mongodb.com)
  - Git

STEP 1: Clone the repository
  git clone https://github.com/YOUR-USERNAME/team-task-manager.git
  cd team-task-manager

STEP 2: Setup Backend
  cd backend
  npm install
  cp .env.example .env
  # Edit .env with your MongoDB URI and JWT secret:
  #   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
  #   JWT_SECRET=your_secret_key_here
  #   PORT=5000

STEP 3: Setup Frontend (new terminal)
  cd frontend
  npm install
  # Create .env.local if using separate backend URL:
  # REACT_APP_API_URL=http://localhost:5000/api

STEP 4: Run both servers
  Terminal 1 (backend):  cd backend && npm run dev
  Terminal 2 (frontend): cd frontend && npm start

  Frontend runs on: http://localhost:3000
  Backend runs on:  http://localhost:5000

----------------------------------------------------------------
HOW TO DEPLOY ON RAILWAY
----------------------------------------------------------------

STEP 1: Create MongoDB Atlas cluster
  1. Go to mongodb.com → Create free account
  2. Create new cluster (free M0 tier)
  3. Create database user (username + password)
  4. Whitelist all IPs: 0.0.0.0/0
  5. Get connection string:
     mongodb+srv://username:password@cluster.mongodb.net/taskflow

STEP 2: Push code to GitHub
  git init
  git add .
  git commit -m "Initial commit: Team Task Manager"
  git branch -M main
  git remote add origin https://github.com/YOUR-USERNAME/team-task-manager.git
  git push -u origin main

STEP 3: Deploy on Railway
  1. Go to railway.app → Sign up with GitHub
  2. Click "New Project" → "Deploy from GitHub repo"
  3. Select your repository
  4. Railway auto-detects railway.toml configuration

STEP 4: Set Environment Variables in Railway
  In Railway dashboard → your service → Variables:
    MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/taskflow
    JWT_SECRET  = any_long_random_string_here_32chars
    NODE_ENV    = production
    FRONTEND_URL = https://YOUR-APP.up.railway.app

STEP 5: Get your live URL
  Railway will give you a URL like:
  https://team-task-manager-production.up.railway.app

  Test it by visiting: https://YOUR-URL.up.railway.app/api/health

----------------------------------------------------------------
HOW TO FIND YOUR LIVE URL
----------------------------------------------------------------
After deploying on Railway:
  1. Go to railway.app → Dashboard
  2. Click your project → Click your service
  3. Go to "Settings" tab → "Domains"
  4. Click "Generate Domain" if not already set
  5. Your URL will be: https://XXXX.up.railway.app

----------------------------------------------------------------
FOLDER STRUCTURE
----------------------------------------------------------------
team-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── middleware/
│   │   └── auth.js          # JWT auth middleware
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Project.js       # Project schema
│   │   └── Task.js          # Task schema
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   ├── projects.js      # Project endpoints
│   │   └── tasks.js         # Task endpoints
│   ├── .env.example         # Environment template
│   ├── package.json
│   └── server.js            # Express app entry
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js    # Sidebar layout
│   │   ├── context/
│   │   │   └── AuthContext.js # Auth state
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   ├── ProjectDetail.js
│   │   │   ├── Tasks.js
│   │   │   └── Team.js
│   │   ├── utils/
│   │   │   └── api.js       # Axios instance
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
├── .gitignore
├── package.json
├── railway.toml             # Railway deploy config
└── README.txt               # This file
