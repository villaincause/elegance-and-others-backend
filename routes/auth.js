const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registration
router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ message: "Please fill all fields" });

    try {
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Explicitly including 'role' as 'customer' for all new sign-ups
        const [result] = await db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
            [full_name, email, hashedPassword, 'customer']
        );
        
        res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

// Login (Standard production logic)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(400).json({ message: "Invalid Email or Password" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) return res.status(400).json({ message: "Invalid Email or Password" });

        // Generate token with role included
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '24h' }
        );

        // Send back user details including role for frontend redirection
        res.json({
            token,
            user: { 
                id: user.id, 
                full_name: user.full_name, 
                email: user.email, 
                role: user.role,
                profile_picture: user.profile_picture 
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error during login" });
    }
});

module.exports = router;