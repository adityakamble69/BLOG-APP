const express = require('express');
const router = express.Router();
const { createBlog, getBlogs, getMyBlogs, getBlogById, updateBlog, deleteBlog } = require('../controllers/blogController');
const authenticate = require('../middleware/auth');

router.get('/', getBlogs);                       // public: view all blogs (supports ?search= & ?category=)
router.get('/mine', authenticate, getMyBlogs);    // protected: only the logged-in user's posts
router.get('/:id', getBlogById);                  // public: view a single blog post's details
router.post('/', authenticate, createBlog);       // protected: must be logged in
router.put('/:id', authenticate, updateBlog);     // protected: only the owner can edit
router.delete('/:id', authenticate, deleteBlog);  // protected: only the owner can delete

module.exports = router;
