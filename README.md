# Notes Management API

A robust and scalable Notes Management API that allows users to create, update, delete, share, and search notes. The API ensures secure access control for shared and owned notes.

## Features
- User authentication and authorization using JWT.
- Create, update, and delete notes.
- Share notes with other users.
- Full-text search for notes.
- Pagination and filtering for efficient data retrieval.

---

## Tech Stack

### Backend
- **Node.js**: Runtime for server-side JavaScript.
- **Express.js**: Fast and lightweight web framework for building REST APIs.

### Database
- **MongoDB**: NoSQL database for storing notes and user data.
- **Mongoose**: ODM library for MongoDB.

### Utilities
- **jsonwebtoken**: For secure user authentication.
- **express-validator**: For robust request validation.
- **dotenv**: For managing environment variables.

### Testing
- **Jest**: Testing framework for unit tests.

---

## Prerequisites
- **Node.js** (v16+)
- **npm** or **yarn**
- **MongoDB**: Ensure MongoDB is installed and running locally or remotely (This Project uses my remote MongoDB ).

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/notes-api.git
   cd notes-api

2. Install dependencies:
   ```bash
   npm install

3. Set up environment variables:
   - Create a `.env` file in the root directory (if not already present).
   - Add the following environment variables:
     ```
        PORT=port that you want project to run on 
        MONGO_URI=connection uri
        DB_PREFIX=preferred database prefix
        NODE_ENV=TEST
        WINDOW_MS=60 (Minutes for rate limiting)
        REQ_LIMIT=1000 (no of requests from same ip in WINDOW MS Minutes)
        JWT_SECRET=JWT Secret
     ```

4. Start the server:
   ```bash
   npm run dev
5. Access the API:
   - The API will be accessible at `http://localhost:3000` by default.
   - Replace `localhost` with your server's domain or IP if deployed remotely.

---

## Running Tests

### Unit Tests
To run unit tests:
```bash
npm run test:unit