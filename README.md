# Blog App — Node.js + Express + Supabase (Postgres)

A small full-stack app with User Registration, User Login, Create Blog, and
Blog Detail APIs, backed by Supabase, plus a vanilla HTML/CSS/JS frontend.

## Project Structure

```
blog-app/
├── backend/
│   ├── config/supabase.js    # Supabase client (service role key)
│   ├── controllers/          # authController.js, blogController.js
│   ├── middleware/auth.js    # JWT verification middleware
│   ├── models/schema.sql     # Postgres schema — run in Supabase SQL Editor
│   ├── routes/               # authRoutes.js, blogRoutes.js
│   ├── server.js             # App entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html          # Home — lists all blogs
    ├── register.html
    ├── login.html
    ├── dashboard.html      # Logged-in user's own posts
    ├── create-blog.html
    ├── post.html           # Single blog post detail page (?id=)
    ├── css/style.css
    ├── js/config.js        # API_BASE — points at your backend
    └── js/script.js
```

## Backend Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Create the tables.** In the Supabase dashboard, go to **SQL Editor → New query**, paste the contents of `backend/models/schema.sql`, and run it. This creates the `users` and `blogs` tables and enables Row Level Security on both (locking them out of Supabase's public REST API — our own Express server is the only intended way in, using the service role key below).

3. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   In your Supabase project, go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ not the `anon` key — the service role key bypasses Row Level Security and must stay on the server, never in frontend code)

   Also set a random `JWT_SECRET`.

5. **Run the server:**
   ```bash
   npm run dev    # with nodemon (auto-restart)
   # or
   npm start
   ```
   Server runs at `http://localhost:5000`. On startup it logs whether it could reach Supabase.

## API Endpoints

| Method | Endpoint             | Auth required | Description                            |
|--------|-----------------------|:--------------:|-----------------------------------------|
| POST   | `/api/auth/register`  | No             | Create a new user account              |
| POST   | `/api/auth/login`     | No             | Log in, returns a JWT token            |
| GET    | `/api/blogs`          | No             | List all blog posts (newest first) — supports `?search=` and `?category=` |
| GET    | `/api/blogs/mine`     | Yes (Bearer)   | List only the logged-in user's posts   |
| GET    | `/api/blogs/:id`      | No             | Get one blog post's full details       |
| POST   | `/api/blogs`          | Yes (Bearer)   | Create a new blog post                 |
| PUT    | `/api/blogs/:id`      | Yes (Bearer)   | Update one of your own posts           |
| DELETE | `/api/blogs/:id`      | Yes (Bearer)   | Delete one of your own posts           |

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

**Single Blog**
```json
GET /api/blogs/42
```

**Update Blog**
```json
PUT /api/blogs/42
Authorization: Bearer <token>
{ "title": "Updated title", "content": "Updated content", "category": "Life", "image": "https://..." }
```

**Search / Filter Blogs**
```
GET /api/blogs?search=hello
GET /api/blogs?category=Tech
GET /api/blogs?search=hello&category=Tech
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
4. Click any post card on the homepage or dashboard to open its full details on `post.html`.
5. On the homepage, use the search box and category dropdown above the post grid to filter posts.
6. On your dashboard, click **Edit** on any of your own posts to update it, or **Delete** to remove it. The post detail page also shows an **Edit post** button when you're viewing your own post.

## Notes

- Passwords are hashed with bcrypt before being stored — Supabase never sees a plaintext password.
- Auth uses our own JWTs (not Supabase Auth): the token is returned on login/register and kept in the browser's `localStorage`; it's sent as a `Bearer` header on protected requests (create blog, my blogs, delete blog).
- The backend talks to Postgres via `@supabase/supabase-js` using the **service role key**, which bypasses Row Level Security — that's expected and safe here because the key only ever lives on the server. `schema.sql` enables RLS with no policies, so nobody can read/write these tables through Supabase's public client-side API.
- `models/schema.sql` defines two tables: `users` and `blogs` (with a foreign key to `users`). `blogs` also has `category` and `image` columns.
- Cover images can be a pasted URL or an uploaded file (stored as a base64 data URL) — the server accepts JSON bodies up to 8MB to allow for this.
