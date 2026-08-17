# 📝 Marginalia — Full-Stack Blog Application

A full-stack blogging platform where anyone can register, write posts, and
browse everyone else's — built with a Node.js/Express REST API backed by
Supabase (Postgres), and a fast, dependency-free HTML/CSS/JS frontend.

> A small, personal blogging space for writers who'd rather leave a margin
> note than shout into a feed.

**Live demo:** _add your deployed URL here after deploying (see [Deployment](#-deployment))_
**API base:** _add your deployed backend URL here_

---

## ✨ Features

- **Authentication** — register/login with hashed passwords (bcrypt) and JWT-based sessions
- **Blog CRUD** — create, read, update, and delete posts, with cover images (URL or upload)
- **Personal dashboard** — see only your own posts, with stats (total posts, categories used, last published) and a profile card
- **Public post feed** — browse every post, with live **search** (title/content) and **category filtering**
- **Individual post pages** — a dedicated, shareable detail page per post
- **Protected routes** — dashboard and the editor redirect to login if you're signed out; expired/invalid sessions are detected automatically and you're bounced back to login with a clear message
- **Responsive UI** — mobile nav sheet, fluid typography, and a layout that holds up from small phones to wide desktops

## 🧱 Tech Stack

| Layer      | Tech |
|------------|------|
| Frontend   | Vanilla HTML, CSS, JavaScript (no build step, no framework) |
| Backend    | Node.js, Express |
| Database   | Supabase (Postgres) via `@supabase/supabase-js` |
| Auth       | bcrypt (password hashing) + JSON Web Tokens |

## 📁 Project Structure

```
blog-app/
├── backend/
│   ├── config/supabase.js     # Supabase client (service role key)
│   ├── controllers/           # authController.js, blogController.js
│   ├── middleware/auth.js     # JWT verification middleware
│   ├── models/schema.sql      # Postgres schema — run once in Supabase SQL Editor
│   ├── routes/                # authRoutes.js, blogRoutes.js
│   ├── server.js              # App entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html            # Home — all posts, with search + category filter
    ├── register.html
    ├── login.html
    ├── dashboard.html        # Logged-in user's own posts + profile
    ├── create-blog.html      # Create a post, or edit one via ?id=
    ├── post.html             # Single post detail page (?id=)
    ├── css/style.css
    └── js/
        ├── config.js          # API_BASE — points at your backend
        └── script.js          # Session handling + all API calls + page logic
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- A free [Supabase](https://supabase.com) account

### 1. Set up Supabase

1. Create a new Supabase project.
2. In **SQL Editor → New query**, paste the contents of `backend/models/schema.sql` and run it. This creates the `users` and `blogs` tables and enables Row Level Security on both (our Express server is the only intended way to reach them, via the service role key).
3. In **Settings → API**, copy your **Project URL** and your **secret / `service_role`** key (not the publishable/anon one).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=some-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://127.0.0.1:5500
```

Then run it:

```bash
npm run dev      # nodemon, auto-restarts
# or
npm start
```

You should see `🚀 Server running on http://localhost:5000` and `✅ Connected to Supabase.`

### 3. Frontend

No build step — it's plain HTML/CSS/JS. Serve the `frontend/` folder with any static server, e.g. the VS Code **Live Server** extension, or:

```bash
npx serve frontend
```

Make sure `frontend/js/config.js` points at your backend:

```js
const CONFIG = {
  API_BASE: "http://localhost:5000/api"
};
```

Open the site, register an account, and start writing.

---

## 🔌 API Reference

Base URL: `/api`

| Method | Endpoint             | Auth required | Description                            |
|--------|-----------------------|:--------------:|-----------------------------------------|
| POST   | `/auth/register`      | No             | Create a new user account              |
| POST   | `/auth/login`         | No             | Log in, returns a JWT token            |
| GET    | `/blogs`               | No             | List all posts (newest first) — supports `?search=` and `?category=` |
| GET    | `/blogs/mine`          | Yes (Bearer)   | List only the logged-in user's posts   |
| GET    | `/blogs/:id`            | No             | Get one post's full details            |
| POST   | `/blogs`               | Yes (Bearer)   | Create a new post                      |
| PUT    | `/blogs/:id`            | Yes (Bearer)   | Update one of your own posts           |
| DELETE | `/blogs/:id`            | Yes (Bearer)   | Delete one of your own posts           |

<details>
<summary><strong>Example requests</strong></summary>

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

**Create post**
```json
POST /api/blogs
Authorization: Bearer <token>
{ "title": "My First Post", "content": "Hello world!", "category": "Life", "image": "https://... or a base64 data URL" }
```

**Update post**
```json
PUT /api/blogs/42
Authorization: Bearer <token>
{ "title": "Updated title", "content": "Updated content", "category": "Life", "image": "https://..." }
```

**Search / filter**
```
GET /api/blogs?search=hello
GET /api/blogs?category=Tech
```

</details>

---

## 🌐 Deployment

This is a two-part deploy: the **backend** (Express API) goes on Render, and
the **frontend** (static files) goes on Vercel or Netlify. Any combination
works as long as the frontend knows the backend's URL.

### Backend → Render

1. Push this repo to GitHub.
2. On [Render](https://render.com), **New → Web Service**, connect your repo.
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables (same as your local `.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (set this to your frontend's deployed URL once you have it — see below).
5. Deploy. Render gives you a URL like `https://your-app.onrender.com`.

> Render's free tier spins down when idle — the first request after a while can take ~30–60s to wake it up. That's expected, not a bug.

### Frontend → Vercel or Netlify

Before deploying, point the frontend at your live backend:

```js
// frontend/js/config.js
const CONFIG = {
  API_BASE: "https://your-app.onrender.com/api"
};
```
Commit that change.

**Vercel:**
1. [New Project](https://vercel.com/new) → import your GitHub repo.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Other (no build step needed)
4. Deploy.

**Netlify:**
1. [Add new site → Import an existing project](https://app.netlify.com) → connect your repo.
2. **Base directory:** `frontend`
3. **Build command:** _(leave blank)_
4. **Publish directory:** `frontend` (or `.` relative to the base directory)
5. Deploy.

### Connect the two

Once your frontend has a live URL (e.g. `https://marginalia.vercel.app`), go back to Render and set `CLIENT_ORIGIN` to that URL (comma-separate it with `http://127.0.0.1:5500` if you still want local dev to work against the deployed API). Redeploy the backend for the change to take effect.

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt before being stored — Supabase never sees a plaintext password.
- Auth uses our own JWTs (not Supabase Auth): the token is returned on login/register, kept in the browser's `localStorage`, and sent as a `Bearer` header on protected requests.
- **Route protection**: `dashboard.html` and `create-blog.html` redirect to `login.html` if there's no valid session; `login.html`/`register.html` redirect to the dashboard if you're already logged in. The real enforcement is server-side — every write (`POST`/`PUT`/`DELETE /api/blogs`) and `/api/blogs/mine` require a valid JWT via the `authenticate` middleware.
- **Session expiry handling**: a `401` on any authenticated request clears the local session and redirects to `login.html?expired=1` with a clear message, instead of leaving the UI stuck.
- The backend talks to Postgres via `@supabase/supabase-js` using the **service role key**, which bypasses Row Level Security — safe here because the key only ever lives on the server (never sent to the browser). `schema.sql` enables RLS with no policies, so nobody can read/write these tables directly through Supabase's public client-side API.
- CORS (`CLIENT_ORIGIN`) accepts a comma-separated list, so you can allow both your local dev server and your deployed frontend at once.

## 🧪 Known Limitations / Ideas for Later

- No image hosting/CDN — cover images are either an external URL or stored inline as a base64 data URL (fine for a learning project, not ideal at scale).
- No pagination on the blog feed yet — fine for a personal project's post count, would need it at larger scale.
- No password-reset flow.

## 📄 License

Built as a learning project. Feel free to fork and adapt.
