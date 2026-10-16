const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// --- CORS CONFIGURATION ---
// Allows both standard and admin frontend ports to communicate with the backend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Serving static images for products and profiles
app.use('/images', express.static(path.join(__dirname, 'public/images')));

const dirs = ['./public/images/products', './public/images/profiles'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const searchRoutes = require('./routes/search');

// Mount auth routes at /api/auth to match frontend Login.tsx calls
app.use('/api/auth', authRoutes); 

// Existing API endpoints
app.use('/api', userRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/customers', require('./routes/customers'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});