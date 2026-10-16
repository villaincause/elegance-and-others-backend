const express = require('express');
const router = express.Router();
const db = require('../db');

// Search Products
router.get('/', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.json([]);
    }

    try {
        const searchTerm = `%${q}%`;
        // Added stock_quantity, discount_price, on_sale, and created_at
        const query = `
            SELECT 
                id, 
                name, 
                price, 
                image_url, 
                category, 
                stock_quantity, 
                discount_price, 
                on_sale, 
                created_at,
                colors,
                sizes
            FROM products 
            WHERE name LIKE ? OR category LIKE ? 
            LIMIT 20
        `;
        
        const [results] = await db.query(query, [searchTerm, searchTerm]);
        
        console.log(`Search for "${q}" returned ${results.length} items.`);
        res.json(results);
    } catch (error) {
        console.error("Search API Error:", error);
        res.status(500).json({ message: "Error performing search" });
    }
});

module.exports = router;