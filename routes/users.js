const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage });

// Update Profile
router.put('/profile', upload.single('profile_picture'), async (req, res) => {
    const { userId, full_name, phone_number } = req.body;
    const profilePic = req.file ? (req.file.path || req.file.filename) : null;

    try {
        if (profilePic) {
            await db.query("UPDATE users SET full_name = ?, phone_number = ?, profile_picture = ? WHERE id = ?", [full_name, phone_number, profilePic, userId]);
        } else {
            await db.query("UPDATE users SET full_name = ?, phone_number = ? WHERE id = ?", [full_name, phone_number, userId]);
        }
        res.json({ message: "Profile updated", profile_picture: profilePic });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile" });
    }
});

// Addresses
router.get('/addresses/:userId', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC", [req.params.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching addresses" });
    }
});

router.post('/addresses', async (req, res) => {
    const { user_id, full_name, address_line1, city, postal_code, phone_number } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO addresses (user_id, full_name, address_line1, city, postal_code, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
            [user_id, full_name, address_line1, city, postal_code, phone_number]
        );
        res.json({ message: "Address added", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Error adding address" });
    }
});

module.exports = router;