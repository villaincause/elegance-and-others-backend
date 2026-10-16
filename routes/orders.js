const express = require('express');
const router = express.Router();
const db = require('../db');

// --- EXISTING CODE (KEEPING UNTOUCHED) ---

// 1. Place Order (Transaction)
router.post('/', async (req, res) => {
    const { userId, totalAmount, addressId, items } = req.body;
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            "INSERT INTO orders (user_id, total_amount, shipping_address_id, shipping_address, status) VALUES (?, ?, ?, '', 'pending')",
            [userId, totalAmount, addressId]
        );
        const orderId = orderResult.insertId;

        const itemQueries = items.map(item => {
            return connection.query(
                "INSERT INTO order_items (order_id, product_id, quantity, size, color_name, color_hex, price_at_purchase) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [orderId, item.productId, item.quantity, item.size, item.colorName, item.colorHex, item.price]
            );
        });

        await Promise.all(itemQueries);
        await connection.commit();
        res.status(201).json({ message: "Order placed successfully", orderId });

    } catch (error) {
        await connection.rollback();
        console.error("Order Transaction Error:", error);
        res.status(500).json({ message: "Failed to place order", details: error.message });
    } finally {
        connection.release();
    }
});

// 2. Get Order History for User
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const query = `
            SELECT 
                o.id AS order_id, o.order_date, o.total_amount, o.status,
                p.name AS product_name, oi.quantity, oi.size, oi.color_name, 
                oi.price_at_purchase, p.image_url
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC
        `;
        const [rows] = await db.query(query, [userId]);
        const ordersMap = new Map();
        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    id: row.order_id,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    status: row.status,
                    items: []
                });
            }
            if (row.product_name) {
                ordersMap.get(row.order_id).items.push({
                    product_name: row.product_name,
                    quantity: row.quantity,
                    size: row.size,
                    color: row.color_name,
                    price: row.price_at_purchase,
                    image: row.image_url
                });
            }
        });
        res.json(Array.from(ordersMap.values()));
    } catch (error) {
        res.status(500).json({ message: "Server database error", details: error.message });
    }
});

// --- NEW ADMINISTRATIVE ENDPOINTS ---

// 3. Admin: Get ALL Orders for Order Log
router.get('/admin/all', async (req, res) => {
    try {
        const query = `
            SELECT 
                o.id, 
                o.status, 
                o.total_amount, 
                o.order_date,
                u.full_name AS customer_name,
                a.address_line1, 
                a.city
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN addresses a ON o.shipping_address_id = a.id
            ORDER BY o.order_date DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch all orders" });
    }
});

// 4. Admin: Update Order Status
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    
    try {
        await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
        res.json({ message: "Order status updated successfully" });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
});

module.exports = router;