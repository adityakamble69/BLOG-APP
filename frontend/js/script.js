/* ==========================================================================
   MARGINALIA — script.js
   Talks to the Node.js/Express + MySQL backend in /backend (see js/config.js
   for the API base URL). The session (JWT token + user info) is kept in
   localStorage; the token is sent as a Bearer header on protected requests.
   ========================================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ==========================================================================
   Session — stores the logged-in user's info plus their JWT token.
   ========================================================================== */
const Session = {
  KEY: "blogapp_session",
  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(user) {
    localStorage.setItem(this.KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(this.KEY);
  },
  getToken() {
    const u = this.get();
    return u && u.token ? u.token : null;
  }
};

/* ==========================================================================
   API wrapper — maps the action names used throughout this file onto the
   real REST endpoints exposed by the Express backend.
   ========================================================================== */
function normalizeBlog(b) {
  return { ...b, image: b.image || "" };
}

async function rawRequest(path, { method = "GET", body, auth = false } = {}) {
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) || "http://localhost:5000/api";
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = Session.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const API = {
  isConfigured() {
    return true;
  },

  async get(action, params = {}) {
    if (action === "getBlogs") {
      const { ok, data } = await rawRequest("/blogs");
      if (!ok) return { success: false, error: data.message };
      return { success: true, blogs: (data.blogs || []).map(normalizeBlog) };
    }
    if (action === "getUserBlogs") {
      const { ok, data } = await rawRequest("/blogs/mine", { auth: true });
      if (!ok) return { success: false, error: data.message };
      return { success: true, blogs: (data.blogs || []).map(normalizeBlog) };
    }
    throw new Error(`Unknown GET action: ${action}`);
  },

  async post(action, payload = {}) {
    if (action === "register") {
      const { ok, data } = await rawRequest("/auth/register", {
        method: "POST",
        body: { name: payload.name, email: payload.email, password: payload.password }
      });
      if (!ok) return { success: false, error: data.message };
      return { success: true, user: data.user };
    }

    if (action === "login") {
      const { ok, data } = await rawRequest("/auth/login", {
        method: "POST",
        body: { email: payload.email, password: payload.password }
      });
      if (!ok) return { success: false, error: data.message };
      return { success: true, user: { ...data.user, token: data.token } };
    }

    if (action === "createBlog") {
      const { ok, data } = await rawRequest("/blogs", {
        method: "POST",
        auth: true,
        body: {
          title: payload.title,
          content: payload.content,
          category: payload.category,
          image: payload.image
        }
      });
      if (!ok) return { success: false, error: data.message };
      return { success: true, blog: normalizeBlog(data.blog) };
    }

    if (action === "deleteBlog") {
      const { ok, data } = await rawRequest(`/blogs/${payload.id}`, {
        method: "DELETE",
        auth: true
      });
      if (!ok) return { success: false, error: data.message };
      return { success: true };
    }

    throw new Error(`Unknown POST action: ${action}`);
  }
};

/* ==========================================================================
   Dark mode
   ========================================================================== */
const THEME_KEY = "blogapp_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  const navbar = document.querySelector(".navbar");
  if (navbar && !navbar.querySelector(".theme-toggle")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle dark mode");
    btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
    navbar.appendChild(btn);
  }
}

/* ==========================================================================
   Loading overlay
   ========================================================================== */
function showLoadingOverlay(message) {
  let overlay = document.querySelector(".loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-brand">Marginalia<span class="dot">.</span></div>
      <div class="spinner"></div>
      <div class="loading-text"></div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.querySelector(".loading-text").textContent = message || "Loading…";
  requestAnimationFrame(() => overlay.classList.add("show"));
  return overlay;
}

function hideLoadingOverlay() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) overlay.classList.remove("show");
}

/* ==========================================================================
   Config banner — shown on every page if API_URL hasn't been set yet
   ========================================================================== */
function initConfigWarning() {
  if (API.isConfigured()) return;
  const bar = document.createElement("div");
  bar.className = "config-warning-bar";
  bar.innerHTML = `Backend not reachable — check <code>CONFIG.API_BASE</code> in <code>js/config.js</code> and make sure the server in <code>/backend</code> is running.`;
  document.body.prepend(bar);
}

/* ==========================================================================
   Navbar: mobile menu toggle + active link highlight + auth state
   ========================================================================== */
function initNavbar() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const overlay = document.querySelector(".nav-overlay");

  function closeMenu() {
    if (!links) return;
    links.classList.remove("open");
    document.body.classList.remove("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    });
    links.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", closeMenu)
    );
    if (overlay) overlay.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  const user = Session.get();
  const authSlot = document.querySelector("[data-auth-slot]");
  if (authSlot) {
    if (user) {
      authSlot.innerHTML = `
        <a href="#" class="nav-cta" data-logout>Logout</a>
      `;
      authSlot.querySelector("[data-logout]").addEventListener("click", (e) => {
        e.preventDefault();
        Session.clear();
        window.location.href = "index.html";
      });
    } else {
      authSlot.innerHTML = `
        <a href="login.html">Login</a>
        <a href="register.html" class="nav-cta">Register</a>
      `;
    }
  }

  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
}

/* ==========================================================================
   Toast helper
   ========================================================================== */
function showToast(message, ms = 2800) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), ms);
}

/* ==========================================================================
   Validation helpers
   ========================================================================== */
function setFieldError(fieldEl, errorEl, message) {
  if (message) {
    fieldEl.classList.add("invalid");
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add("show"); }
    return false;
  } else {
    fieldEl.classList.remove("invalid");
    if (errorEl) { errorEl.classList.remove("show"); }
    return true;
  }
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

function friendlyNetworkError(err) {
  return "Couldn't reach the server. Check that the backend is running and your connection is working, then try again.";
}

/* ==========================================================================
   Register page
   ========================================================================== */
function initRegisterForm() {
  const form = document.querySelector("#register-form");
  if (!form) return;

  const nameInput = form.querySelector("#reg-name");
  const emailInput = form.querySelector("#reg-email");
  const pwInput = form.querySelector("#reg-password");
  const confirmInput = form.querySelector("#reg-confirm");
  const banner = form.querySelector(".form-banner");
  const strengthMeter = form.querySelector(".strength-meter");
  const submitBtn = form.querySelector("button[type=submit]");

  pwInput.addEventListener("input", () => {
    const val = pwInput.value;
    if (!strengthMeter) return;
    const level = passwordStrength(val);
    strengthMeter.className = "strength-meter" + (val ? " " + level : "");
  });

  form.querySelectorAll(".password-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-row").querySelector("input");
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.textContent = showing ? "Show" : "Hide";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    valid = setFieldError(nameInput, document.getElementById("err-name"),
      nameInput.value.trim().length < 2 ? "Enter your full name." : "") && valid;

    valid = setFieldError(emailInput, document.getElementById("err-email"),
      !EMAIL_RE.test(emailInput.value.trim()) ? "Enter a valid email address." : "") && valid;

    valid = setFieldError(pwInput, document.getElementById("err-password"),
      pwInput.value.length < 6 ? "Password must be at least 6 characters." : "") && valid;

    valid = setFieldError(confirmInput, document.getElementById("err-confirm"),
      confirmInput.value !== pwInput.value ? "Passwords don't match." : "") && valid;

    if (!valid) {
      banner.textContent = "Please fix the errors below and try again.";
      banner.className = "form-banner error show";
      return;
    }

    submitBtn.disabled = true;
    showLoadingOverlay("Setting up your account…");

    try {
      const result = await API.post("register", {
        name: nameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        password: pwInput.value
      });

      if (!result.success) {
        hideLoadingOverlay();
        submitBtn.disabled = false;
        if (result.error && result.error.toLowerCase().includes("email")) {
          setFieldError(emailInput, document.getElementById("err-email"), result.error);
        }
        banner.textContent = result.error || "Something went wrong. Please try again.";
        banner.className = "form-banner error show";
        return;
      }

      banner.textContent = "Account created! Redirecting to login…";
      banner.className = "form-banner success show";
      setTimeout(() => { window.location.href = "login.html"; }, 900);
    } catch (err) {
      hideLoadingOverlay();
      submitBtn.disabled = false;
      banner.textContent = friendlyNetworkError(err);
      banner.className = "form-banner error show";
    }
  });
}

/* ==========================================================================
   Login page
   ========================================================================== */
function initLoginForm() {
  const form = document.querySelector("#login-form");
  if (!form) return;

  const emailInput = form.querySelector("#login-email");
  const pwInput = form.querySelector("#login-password");
  const banner = form.querySelector(".form-banner");
  const submitBtn = form.querySelector("button[type=submit]");

  form.querySelectorAll(".password-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-row").querySelector("input");
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.textContent = showing ? "Show" : "Hide";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    valid = setFieldError(emailInput, document.getElementById("err-login-email"),
      !EMAIL_RE.test(emailInput.value.trim()) ? "Enter a valid email address." : "") && valid;

    valid = setFieldError(pwInput, document.getElementById("err-login-password"),
      pwInput.value.length === 0 ? "Enter your password." : "") && valid;

    if (!valid) {
      banner.textContent = "Please fix the errors below and try again.";
      banner.className = "form-banner error show";
      return;
    }

    submitBtn.disabled = true;
    showLoadingOverlay("Logging you in…");

    try {
      const result = await API.post("login", {
        email: emailInput.value.trim().toLowerCase(),
        password: pwInput.value
      });

      if (!result.success) {
        hideLoadingOverlay();
        submitBtn.disabled = false;
        banner.textContent = result.error || "Email or password is incorrect.";
        banner.className = "form-banner error show";
        setFieldError(pwInput, document.getElementById("err-login-password"), "Check your password.");
        return;
      }

      Session.set(result.user);
      banner.textContent = "Welcome back! Redirecting…";
      banner.className = "form-banner success show";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 900);
    } catch (err) {
      hideLoadingOverlay();
      submitBtn.disabled = false;
      banner.textContent = friendlyNetworkError(err);
      banner.className = "form-banner error show";
    }
  });
}

/* ==========================================================================
   Dashboard page
   ========================================================================== */
async function initDashboard() {
  const root = document.querySelector("[data-dashboard]");
  if (!root) return;

  const user = Session.get();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.querySelector("[data-user-name]").textContent = user.name;
  document.querySelector("[data-user-email]").textContent = user.email;
  document.querySelector("[data-user-initial]").textContent = user.name.trim().charAt(0).toUpperCase();

  const grid = document.querySelector("[data-my-blogs]");
  const emptyState = document.querySelector("[data-empty-state]");

  function renderStats(blogs) {
    document.querySelector("[data-stat-total]").textContent = blogs.length;
    document.querySelector("[data-stat-categories]").textContent = new Set(blogs.map(b => b.category)).size;
    document.querySelector("[data-stat-latest]").textContent =
      blogs.length ? new Date(blogs[0].date).toLocaleDateString() : "—";
  }

  function renderGrid(blogs) {
    grid.innerHTML = "";
    if (!blogs.length) {
      emptyState.style.display = "block";
      grid.style.display = "none";
      return;
    }
    emptyState.style.display = "none";
    grid.style.display = "grid";

    blogs.forEach(blog => {
      const card = document.createElement("article");
      card.className = "blog-card";
      card.innerHTML = `
        <img class="thumb" src="${blog.image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80'}" alt="${blog.title}">
        <div class="body">
          <div class="meta"><span>${blog.category}</span><span>·</span><span>${new Date(blog.date).toLocaleDateString()}</span></div>
          <h3>${blog.title}</h3>
          <p class="excerpt">${blog.content}</p>
          <div class="card-foot">
            <span class="read-more">By you</span>
            <div class="card-actions">
              <button type="button" data-delete="${blog.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this blog post? This can't be undone.")) return;
        const id = btn.getAttribute("data-delete");
        btn.disabled = true;
        btn.textContent = "Deleting…";
        try {
          const result = await API.post("deleteBlog", { id, authorEmail: user.email });
          if (!result.success) {
            showToast(result.error || "Couldn't delete that post.");
            btn.disabled = false;
            btn.textContent = "Delete";
            return;
          }
          showToast("Blog post deleted.");
          await load();
        } catch (err) {
          showToast(friendlyNetworkError(err));
          btn.disabled = false;
          btn.textContent = "Delete";
        }
      });
    });
  }

  async function load() {
    try {
      const result = await API.get("getUserBlogs", { email: user.email });
      const blogs = result.success ? result.blogs : [];
      renderStats(blogs);
      renderGrid(blogs);
    } catch (err) {
      grid.innerHTML = `<p class="field-error show">${friendlyNetworkError(err)}</p>`;
      emptyState.style.display = "none";
    }
  }

  await load();
}

/* ==========================================================================
   Create Blog page
   ========================================================================== */
function initCreateBlogForm() {
  const form = document.querySelector("#create-blog-form");
  if (!form) return;

  const user = Session.get();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const titleInput = form.querySelector("#blog-title");
  const categoryInput = form.querySelector("#blog-category");
  const contentInput = form.querySelector("#blog-content");
  const imageInput = form.querySelector("#blog-image");
  const imageUrlInput = form.querySelector("#blog-image-url");
  const preview = form.querySelector(".image-preview");
  const previewImg = preview.querySelector("img");
  const charCount = form.querySelector("[data-char-count]");
  const banner = form.querySelector(".form-banner");
  const submitBtn = form.querySelector("button[type=submit]");

  let imageDataUrl = "";

  contentInput.addEventListener("input", () => {
    charCount.textContent = `${contentInput.value.length} characters`;
  });

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imageDataUrl = reader.result;
      previewImg.src = imageDataUrl;
      preview.classList.add("show");
      imageUrlInput.value = "";
    };
    reader.readAsDataURL(file);
  });

  imageUrlInput.addEventListener("input", () => {
    if (imageUrlInput.value.trim()) {
      imageDataUrl = "";
      previewImg.src = imageUrlInput.value.trim();
      preview.classList.add("show");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    valid = setFieldError(titleInput, document.getElementById("err-title"),
      titleInput.value.trim().length < 4 ? "Give your post a title (4+ characters)." : "") && valid;

    valid = setFieldError(categoryInput, document.getElementById("err-category"),
      !categoryInput.value ? "Choose a category." : "") && valid;

    valid = setFieldError(contentInput, document.getElementById("err-content"),
      contentInput.value.trim().length < 40 ? "Write at least 40 characters of content." : "") && valid;

    if (!valid) {
      banner.textContent = "Please fix the errors below before publishing.";
      banner.className = "form-banner error show";
      return;
    }

    submitBtn.disabled = true;
    showLoadingOverlay("Publishing your post…");

    try {
      const result = await API.post("createBlog", {
        title: titleInput.value.trim(),
        category: categoryInput.value,
        image: imageDataUrl || imageUrlInput.value.trim(),
        content: contentInput.value.trim(),
        author: user.name,
        authorEmail: user.email
      });

      if (!result.success) {
        hideLoadingOverlay();
        submitBtn.disabled = false;
        banner.textContent = result.error || "Something went wrong. Please try again.";
        banner.className = "form-banner error show";
        return;
      }

      banner.textContent = "Published! Redirecting to your dashboard…";
      banner.className = "form-banner success show";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
    } catch (err) {
      hideLoadingOverlay();
      submitBtn.disabled = false;
      banner.textContent = friendlyNetworkError(err);
      banner.className = "form-banner error show";
    }
  });
}

/* ==========================================================================
   Home page: hero stats count-up
   ========================================================================== */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function initStatsCounter() {
  const stats = document.querySelectorAll("[data-count]");
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);

      const target = parseFloat(el.getAttribute("data-target")) || 0;
      const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1500 + i * 80;
      const startDelay = 480 + i * 90;

      setTimeout(() => {
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = easeOutCubic(p);
          const value = target * eased;
          el.textContent = value.toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, startDelay);
    });
  }, { threshold: 0.25 });

  stats.forEach(el => observer.observe(el));
}

/* ==========================================================================
   Home page: render featured blogs
   ========================================================================== */
async function initHomeFeed() {
  const grid = document.querySelector("[data-featured-blogs]");
  if (!grid) return;

  grid.innerHTML = `<p class="field-hint">Loading posts…</p>`;

  try {
    const result = await API.get("getBlogs");
    const blogs = (result.success ? result.blogs : []).slice(0, 6);

    grid.innerHTML = "";
    if (!blogs.length) {
      grid.innerHTML = `<p class="field-hint">No posts yet — be the first to <a href="register.html">write one</a>.</p>`;
      return;
    }

    blogs.forEach(blog => {
      const card = document.createElement("article");
      card.className = "blog-card";
      card.innerHTML = `
        <img class="thumb" src="${blog.image || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80'}" alt="${blog.title}">
        <div class="body">
          <div class="meta"><span>${blog.category}</span><span>·</span><span>${new Date(blog.date).toLocaleDateString()}</span></div>
          <h3>${blog.title}</h3>
          <p class="excerpt">${blog.content}</p>
          <div class="card-foot">
            <span>${blog.author}</span>
            <span class="read-more">Read →</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="field-error show">${friendlyNetworkError(err)}</p>`;
  }
}

/* ==========================================================================
   Boot
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initConfigWarning();
  initNavbar();
  initStatsCounter();
  initHomeFeed();
  initRegisterForm();
  initLoginForm();
  initDashboard();
  initCreateBlogForm();
});