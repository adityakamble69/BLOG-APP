const supabase = require('../config/supabase');

// Columns pulled for every blog, with the author embedded via the
// blogs.user_id -> users.id foreign key relationship.
const BLOG_SELECT = 'id, title, content, category, image, created_at, users ( id, name, email )';

// Flattens Supabase's nested `users` object into the flat shape
// (author, author_id, authorEmail, date) the frontend already expects.
function mapBlogRow(row) {
  if (!row) return null;
  const { users, created_at, ...rest } = row;
  return {
    ...rest,
    created_at,
    date: created_at,
    author: users ? users.name : null,
    author_id: users ? users.id : null,
    authorEmail: users ? users.email : null,
  };
}

// POST /api/blogs  (protected)
async function createBlog(req, res) {
  try {
    const { title, content, category, image } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const { data, error } = await supabase
      .from('blogs')
      .insert({
        user_id: userId,
        title,
        content,
        category: category || null,
        image: image || null,
      })
      .select(BLOG_SELECT)
      .single();
    if (error) throw error;

    return res.status(201).json({
      message: 'Blog created successfully.',
      blog: mapBlogRow(data),
    });
  } catch (err) {
    console.error('Create blog error:', err);
    return res.status(500).json({ message: 'Server error while creating blog.' });
  }
}

// GET /api/blogs  (public - list all blogs, newest first)
async function getBlogs(req, res) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select(BLOG_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return res.json({ blogs: data.map(mapBlogRow) });
  } catch (err) {
    console.error('Get blogs error:', err);
    return res.status(500).json({ message: 'Server error while fetching blogs.' });
  }
}

// GET /api/blogs/mine  (protected - only the logged-in user's own posts, newest first)
async function getMyBlogs(req, res) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select(BLOG_SELECT)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return res.json({ blogs: data.map(mapBlogRow) });
  } catch (err) {
    console.error('Get my blogs error:', err);
    return res.status(500).json({ message: 'Server error while fetching your blogs.' });
  }
}

// GET /api/blogs/:id  (public - view a single blog post's details)
async function getBlogById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('blogs')
      .select(BLOG_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    return res.json({ blog: mapBlogRow(data) });
  } catch (err) {
    console.error('Get blog by id error:', err);
    return res.status(500).json({ message: 'Server error while fetching that blog post.' });
  }
}

// DELETE /api/blogs/:id  (protected - only the owner can delete)
async function deleteBlog(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: existing, error: lookupError } = await supabase
      .from('blogs')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }
    if (existing.user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts.' });
    }

    const { error: deleteError } = await supabase.from('blogs').delete().eq('id', id);
    if (deleteError) throw deleteError;

    return res.json({ message: 'Blog post deleted.' });
  } catch (err) {
    console.error('Delete blog error:', err);
    return res.status(500).json({ message: 'Server error while deleting blog.' });
  }
}

module.exports = { createBlog, getBlogs, getMyBlogs, getBlogById, deleteBlog };
