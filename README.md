# DevPulse 🚀

> Internal Tech Issue & Feature Tracker API

DevPulse is a robust, production-ready backend API built with Node.js, Express, TypeScript, and PostgreSQL. It is designed to track internal technical issues and feature requests, featuring role-based access control (RBAC) to manage permissions between standard **Contributors** and admin **Maintainers**.

---

## 🔗 Live URL
* **Production API URL:** [Live Link](https://a02-level-2.onrender.com/)
* **API base route:** `/api`

---

## ✨ Features

- **Role-Based Access Control (RBAC)**: Secure authentication and authorization using JWT with two distinct roles:
  - `contributor`: Can report issues, view all issues, and edit their *own* issues (only while they are in the `open` state).
  - `maintainer`: Full access. Can modify any issue, change status (`open` ➔ `in_progress` ➔ `resolved`), and delete issues.
- **Issue & Feature Request Tracking**: Seamless management of project items categorized as either `bug` or `feature_request`.
- **Flexible Queries**: Supports server-side filtering (by `type` and `status`) and sorting (by `newest` or `oldest` creation dates).
- **Auto-Initializing Database**: Automatically runs database setup on startup, checking and creating tables if they do not exist.
- **Robust Error Handling**: Centralized global error handling with standard JSON responses for errors and invalid resource requests.

---

## 🛠️ Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v20+)
- **Backend Framework:** [Express.js](https://expressjs.com/) (v4.19.2)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/) (v5.4.5)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (pg v8.12.0)
- **Authentication:** [JSON Web Token (JWT)](https://jwt.io/) & [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing
- **Development Tooling:** [tsx](https://github.com/privatenumber/tsx) (TypeScript Execute) for hot-reloading development server

---

## 🗄️ Database Schema Summary

The database uses PostgreSQL with two main tables: `users` and `issues`. Below is the schema structure.

### 1. `users` Table
Stores user registration data and roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for each user |
| `name` | `VARCHAR(100)` | `NOT NULL` | User's full name |
| `email` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | Unique email used for login |
| `password` | `TEXT` | `NOT NULL` | Bcrypt hashed password |
| `role` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'contributor'` | Check constraint: `contributor` or `maintainer` |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Last update timestamp |

### 2. `issues` Table
Stores tracked bugs and feature requests.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for each issue |
| `title` | `VARCHAR(150)` | `NOT NULL` | Issue title (max 150 characters) |
| `description`| `TEXT` | `NOT NULL` | Detailed description (min 20 characters) |
| `type` | `VARCHAR(20)` | `NOT NULL` | Check constraint: `bug` or `feature_request` |
| `status` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'open'` | Check constraint: `open`, `in_progress`, or `resolved` |
| `reporter_id`| `INTEGER` | `NOT NULL` | Conceptual reference to `users.id` (creator) |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Issue creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Last update timestamp |

---

## 🚦 API Endpoints

### Auth Module (`/api/auth`)

#### `POST /signup`
Registers a new user account.
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword",
    "role": "contributor" // Optional. Options: "contributor" | "maintainer". Defaults to "contributor".
  }
  ```
- **Responses:**
  - `201 Created`: User created successfully.
  - `400 Bad Request`: Validation failure (email already exists, password < 6 characters, invalid role).

#### `POST /login`
Authenticates a user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword"
  }
  ```
- **Responses:**
  - `200 OK`: Login successful. Returns JWT token (to be sent in headers as authorization value) and user info (excluding password).
  - `401 Unauthorized`: Invalid credentials.

---

### Issues Module (`/api/issues`)

> **Note on Authorization**: For endpoints requiring authentication, pass the raw JWT token string directly in the `Authorization` request header.

#### `POST /`
Creates a new issue.
- **Headers:** `Authorization: <JWT_TOKEN>`
- **Request Body:**
  ```json
  {
    "title": "API crashes on empty body",
    "description": "Sending an empty body to POST /api/issues causes a crash without response.",
    "type": "bug" // Options: "bug" | "feature_request"
  }
  ```
- **Responses:**
  - `201 Created`: Issue created successfully.
  - `400 Bad Request`: Input validation failed (title empty or > 150 chars, description < 20 chars, invalid type).
  - `401 Unauthorized`: Missing or invalid JWT token.

#### `GET /`
Retrieves a list of all issues with their reporter profiles. (Publicly readable)
- **Query Parameters (Optional):**
  - `sort`: Order by creation date. Options: `newest` (default) | `oldest`.
  - `type`: Filter by type. Options: `bug` | `feature_request`.
  - `status`: Filter by status. Options: `open` | `in_progress` | `resolved`.
- **Responses:**
  - `200 OK`: Issues retrieved successfully.

#### `GET /:id`
Retrieves detailed information of a single issue by ID. (Publicly readable)
- **Responses:**
  - `200 OK`: Issue retrieved successfully.
  - `400 Bad Request`: Invalid issue ID format.
  - `404 Not Found`: Issue does not exist.

#### `PATCH /:id`
Updates an existing issue.
- **Headers:** `Authorization: <JWT_TOKEN>`
- **Request Body (All fields optional):**
  ```json
  {
    "title": "Updated Issue Title",
    "description": "Updated issue description that meets length requirements.",
    "type": "feature_request",
    "status": "in_progress" // "open" | "in_progress" | "resolved"
  }
  ```
- **Access Constraints:**
  - **Contributor Role**: Can only update their *own* issues, and only when the current status is `open`. They **cannot** modify the `status` field.
  - **Maintainer Role**: Can update any issue and can modify all fields including `status`.
- **Responses:**
  - `200 OK`: Issue updated successfully.
  - `400 Bad Request`: Validation failure on fields.
  - `401 Unauthorized`: Token invalid or missing.
  - `403 Forbidden`: Contributor trying to update another user's issue, or trying to update the status field.
  - `409 Conflict`: Contributor trying to update an issue whose status is no longer `open` (e.g. `in_progress` or `resolved`).

#### `DELETE /:id`
Permanently deletes an issue.
- **Headers:** `Authorization: <JWT_TOKEN>`
- **Access Constraints:** Restrictive to **Maintainer** role only.
- **Responses:**
  - `200 OK`: Issue deleted successfully.
  - `401 Unauthorized`: Token invalid or missing.
  - `403 Forbidden`: User role is not `maintainer`.
  - `404 Not Found`: Issue does not exist.

---

### Root Module (`/`)

#### `GET /`
Health check and greetings endpoint.
- **Responses:**
  - `200 OK`: Greeting JSON payload.

---

## 🚀 Setup Steps

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database server (local instance or a hosted pooler like [Neon DB](https://neon.tech/))

### 2. Clone the Repository
```bash
git clone https://github.com/yourusername/devpulse.git
cd devpulse
```

### 3. Install Dependencies
Run the following command to download and install all package dependencies:
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env` in the root of the project (copying from `.env.example` if available) and configure the variables:
```env
PORT=6000
CONNECTIONSTRING=postgresql://<username>:<password>@<host>:<port>/<dbname>?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
SALT_ROUNDS=10
```

### 5. Running the Application

#### Development Mode (with hot-reloading)
Runs the development server using `tsx watch` to monitor source changes:
```bash
npm run dev
```

#### Production Build & Start
Compile TypeScript to JavaScript, then run the built distribution server:
```bash
# Compile TS to JS
npm run build

# Start the compiled JS application
npm run start
```

#### Running Tests
Execute integration tests to verify registration, login, JWT authorization, and role checks on endpoints:
```bash
npm run test
```
