# Dashboard Application

A full-stack dashboard application built with React (frontend), Node.js with Express (backend), Prisma ORM, and MySQL (database).

## Project Structure

This project is organized as a monorepo with the following structure:

- `frontend/`: React application built with Vite, React Router, Tailwind CSS, and shadcn/ui
- `backend/`: Node.js Express API with TypeScript, Prisma ORM, and MySQL

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- MySQL database running locally or accessible remotely
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Update the `.env` file with your MySQL connection details:
     ```
     DATABASE_URL="mysql://username:password@localhost:3306/dashboarddb"
     PORT=5000
     NODE_ENV=development
     ```

4. Generate Prisma client:
   ```
   npm run prisma:generate
   ```

5. Run migrations to create database tables:
   ```
   npm run prisma:migrate
   ```

6. Seed the database with initial data:
   ```
   npm run db:seed
   ```

7. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to see the application.

## Features

- Modern UI with Tailwind CSS and shadcn/ui components
- React Router for navigation
- Express API with TypeScript
- MySQL database with Prisma ORM
- User management

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a single user by ID
- `POST /api/users` - Create a new user

## Development

To develop both frontend and backend simultaneously, you'll need to run both servers in separate terminal windows.

Backend (port 5000):
```
cd backend
npm run dev
```

Frontend (port 5173):
```
cd frontend
npm run dev
``` 