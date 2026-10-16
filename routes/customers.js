const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all customers for the Admin Panel
router.get('/', async (req, res) => {
    try {
        // Optimized query: 
        // 1. Fetches essential user details.
        // 2. Uses subqueries to grab the first available address/city for that user.
        // 3. Filters to show ONLY users with the 'customer' role.
        const query = `
            SELECT 
                u.id, 
                u.full_name, 
                u.email, 
                u.phone_number, 
                u.created_at as joined_date,
                (SELECT address_line1 FROM addresses WHERE user_id = u.id LIMIT 1) as address,
                (SELECT city FROM addresses WHERE user_id = u.id LIMIT 1) as city
            FROM users u
            WHERE u.role = 'customer'
            ORDER BY u.created_at DESC
        `;
        
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ message: "Error fetching customer list" });
    }
});

module.exports = router;