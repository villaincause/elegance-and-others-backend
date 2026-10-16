const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { storage } = require('../config/cloudinary');

// --- MULTER WITH CLOUDINARY STORAGE ---
const upload = multer({ storage });

// 1. GET ALL PRODUCTS
router.get('/', async (req, res) => {
  const { category, filter, sort, availability, sizes, colors, minPrice, maxPrice } = req.query;

  let sql = 'SELECT * FROM products WHERE 1=1';
  let queryParams = [];

  if (category && category !== 'Shop All') {
    sql += ' AND category = ?';
    queryParams.push(category);
  }

  if (availability === 'in-stock') {
    sql += ' AND stock_quantity > 0';
  } else if (availability === 'out-of-stock') {
    sql += ' AND stock_quantity = 0';
  }

  if (filter === 'new') {
    sql += ' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  } else if (filter === 'sale') {
    sql += ' AND on_sale = 1';
  }

  if (sizes && sizes.trim() !== '') {
    const sizeArray = sizes.split(',').filter(s => s.trim() !== '');
    if (sizeArray.length > 0) {
      sql += ` AND (${sizeArray.map(() => 'JSON_CONTAINS(sizes, JSON_QUOTE(?))').join(' OR ')})`;
      queryParams.push(...sizeArray);
    }
  }

  if (colors && colors.trim() !== '') {
    const colorArray = colors.split(',').filter(c => c.trim() !== '');
    if (colorArray.length > 0) {
      sql += ` AND (${colorArray.map(() => 'JSON_CONTAINS(colors, JSON_OBJECT("name", ?))').join(' OR ')})`;
      queryParams.push(...colorArray);
    }
  }

  if (minPrice) {
    sql += ' AND price >= ?';
    queryParams.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += ' AND price <= ?';
    queryParams.push(Number(maxPrice));
  }

  if (sort === 'price-low') {
    sql += ' ORDER BY price ASC';
  } else if (sort === 'price-high') {
    sql += ' ORDER BY price DESC';
  } else {
    sql += ' ORDER BY created_at DESC';
  }

  try {
    const [results] = await db.query(sql, queryParams);
    res.json(results);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// 2. ADD OR UPDATE PRODUCT
router.post('/', upload.array('images', 5), async (req, res) => {
  // Extract all fields including discount_price
  const { id, name, category, price, stock_quantity, description, on_sale, discount_price } = req.body;
  
  const colors = req.body.colors || '[]';
  const sizes = req.body.sizes || '[]';

  try {
    const uploadedFiles = req.files ? req.files.map(f => f.path || f.filename) : [];
    
    // Use the first file as the main image_url
    const image_url = uploadedFiles.length > 0 ? uploadedFiles[0] : req.body.image_url;
    
    // Store remaining files in the images column as a JSON array string
    const extra_images = uploadedFiles.length > 1 
      ? JSON.stringify(uploadedFiles.slice(1)) 
      : (req.body.images || '[]');

    // Logic for sale status and numeric conversion
    const isOnSale = (on_sale === 'true' || on_sale === '1' || on_sale === 1) ? 1 : 0;
    
    // Ensure discount_price is null if not on sale or if the field is empty
    const finalDiscountPrice = isOnSale && discount_price !== '' ? discount_price : null;

    if (id) {
      // Edit mode: Added discount_price to columns and parameters
      const sql = `UPDATE products SET name=?, category=?, price=?, stock_quantity=?, description=?, image_url=?, images=?, colors=?, sizes=?, on_sale=?, discount_price=? WHERE id=?`;
      
      const params = [
        name, category, price, stock_quantity, description, 
        image_url, extra_images, colors, sizes, isOnSale, 
        finalDiscountPrice, id
      ];

      await db.query(sql, params);
      res.json({ message: "Product updated" });
    } else {
      // Add mode: Added discount_price to columns and parameters
      const sql = `INSERT INTO products (name, category, price, stock_quantity, description, image_url, images, colors, sizes, on_sale, discount_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        name, category, price, stock_quantity, description, 
        image_url, extra_images, colors, sizes, isOnSale, 
        finalDiscountPrice
      ];

      await db.query(sql, params);
      res.status(201).json({ message: "Product created" });
    }
  } catch (err) {
    console.error("Upload/Insert Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE PRODUCT
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. QUICK PATCH
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { price, stock_quantity } = req.body;
  try {
    await db.query('UPDATE products SET price = ?, stock_quantity = ? WHERE id = ?', [price, stock_quantity, id]);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;