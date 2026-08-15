const pool = require('../config/db');

const BLOG_SELECT = `
  SELECT blogs.id, blogs.title, blogs.content, blogs.category, blogs.image,
         blogs.created_at AS date,
         users.name AS author, users.id AS author_id, users.email AS authorEmail
  FROM blogs
  JOIN users ON blogs.user_id = users.id
`;

// POST /api/blogs  (protected)
async function createBlog(req, res) {
  try {
    const { title, content, category, image } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO blogs (user_id, title, content, category, image) VALUES (?, ?, ?, ?, ?)',
      [userId, title, content, category || null, image || null]
    );

    const [rows] = await pool.query(`${BLOG_SELECT} WHERE blogs.id = ?`, [result.insertId]);

    return res.status(201).json({
      message: 'Blog created successfully.',
      blog: rows[0],
    });
  } catch (err) {
    console.error('Create blog error:', err);
    return res.status(500).json({ message: 'Server error while creating blog.' });
  }
}

// GET /api/blogs  (public - list all blogs, newest first)
async function getBlogs(req, res) {
  try {
    const [rows] = await pool.query(`${BLOG_SELECT} ORDER BY blogs.created_at DESC`);
    return res.json({ blogs: rows });
  } catch (err) {
    console.error('Get blogs error:', err);
    return res.status(500).json({ message: 'Server error while fetching blogs.' });
  }
}

// GET /api/blogs/mine  (protected - only the logged-in user's own posts, newest first)
async function getMyBlogs(req, res) {
  try {
    const [rows] = await pool.query(
      `${BLOG_SELECT} WHERE blogs.user_id = ? ORDER BY blogs.created_at DESC`,
      [req.user.id]
    );
    return res.json({ blogs: rows });
  } catch (err) {
    console.error('Get my blogs error:', err);
    return res.status(500).json({ message: 'Server error while fetching your blogs.' });
  }
}

// DELETE /api/blogs/:id  (protected - only the owner can delete)
async function deleteBlog(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await pool.query('SELECT id, user_id FROM blogs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }
    if (existing[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts.' });
    }

    await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
    return res.json({ message: 'Blog post deleted.' });
  } catch (err) {
    console.error('Delete blog error:', err);
    return res.status(500).json({ message: 'Server error while deleting blog.' });
  }
}

module.exports = { createBlog, getBlogs, getMyBlogs, deleteBlog };
