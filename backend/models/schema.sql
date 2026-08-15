-- Run this once against your MySQL server to create the database and tables.
-- Example: mysql -u root -p < models/schema.sql

CREATE DATABASE IF NOT EXISTS blog_app;
USE blog_app;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT NULL,
  image MEDIUMTEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- If you already ran an older version of this schema and the `blogs` table
-- exists without these columns, run this once to migrate it:
-- ALTER TABLE blogs ADD COLUMN category VARCHAR(50) DEFAULT NULL;
-- ALTER TABLE blogs ADD COLUMN image MEDIUMTEXT DEFAULT NULL;
