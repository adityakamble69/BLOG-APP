# Blog App — Node.js + Express + MySQL

A small full-stack app with User Registration, User Login, and Create Blog APIs, plus a vanilla HTML/CSS/JS frontend.

## Project Structure

```
blog-app/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # authController.js, blogController.js
│   ├── middleware/auth.js    # JWT verification middleware
│   ├── models/schema.sql     # Database schema
│   ├── routes/               # authRoutes.js, blogRoutes.js
│   ├── server.js             # App entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── register.html
    ├── login.html
    ├── dashboard.html
    ├── create-blog.html
    ├── css/style.css
    ├── js/config.js       # API_BASE — points at your backend
    └── js/script.js
```

## Backend Setup

1. **Install MySQL** locally (or use a hosted instance), then create the database and tables:
   ```bash
   cd backend
   mysql -u root -p < models/schema.sql
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your MySQL credentials and a random `JWT_SECRET`.

4. **Run the server:**
   ```bash
   npm run dev    # with nodemon (auto-restart)
   # or
   npm start
   ```
   Server runs at `http://localhost:5000`.

## API Endpoints

| Method | Endpoint             | Auth required | Description                          |
|--------|-----------------------|:--------------:|---------------------------------------|
| POST   | `/api/auth/register`  | No             | Create a new user account            |
| POST   | `/api/auth/login`     | No             | Log in, returns a JWT token          |
| GET    | `/api/blogs`          | No             | List all blog posts (newest first)   |
| GET    | `/api/blogs/mine`     | Yes (Bearer)   | List only the logged-in user's posts |
| POST   | `/api/blogs`          | Yes (Bearer)   | Create a new blog post               |
| DELETE | `/api/blogs/:id`      | Yes (Bearer)   | Delete one of your own posts         |

**Register**
```json
POST /api/auth/register
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }
```

**Login**
```json
POST /api/auth/login
{ "email": "jane@example.com", "password": "secret123" }
```
Response includes `token` — send it as `Authorization: Bearer <token>` on protected routes.

**Create Blog**
```json
POST /api/blogs
Authorization: Bearer <token>
{ "title": "My First Post", "content": "Hello world!", "category": "Life", "image": "https://... or a base64 data URL" }
```

**My Blogs**
```json
GET /api/blogs/mine
Authorization: Bearer <token>
```

**Delete Blog**
```json
DELETE /api/blogs/42
Authorization: Bearer <token>
```

## Frontend Setup

The frontend is plain HTML/CSS/JS — no build step needed.

1. Open `frontend/index.html` with a local server (e.g. the VS Code "Live Server" extension, or `npx serve frontend`). Opening it directly as a `file://` URL also works for basic testing, but a local server is recommended.
2. Make sure `CONFIG.API_BASE` in `frontend/js/config.js` matches your backend URL (defaults to `http://localhost:5000/api`).
3. Update `CLIENT_ORIGIN` in the backend `.env` to match wherever your frontend is served from, so CORS allows it.

## Notes

- Passwords are hashed with bcrypt before being stored.
- Auth uses JWTs: the token is returned on login/register and kept in the browser's `localStorage` alongside the user's name/email; it's sent as a `Bearer` header on protected requests (create blog, my blogs, delete blog).
- `models/schema.sql` defines two tables: `users` and `blogs` (with a foreign key to `users`). `blogs` also has `category` and `image` columns — if you already had an older database, run the two `ALTER TABLE` lines at the bottom of `schema.sql` once to add them.
- Cover images can be a pasted URL or an uploaded file (stored as a base64 data URL) — the server accepts JSON bodies up to 8MB to allow for this.
