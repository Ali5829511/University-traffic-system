/**
 * University Traffic Management System - Backend Server
 * نظام إدارة المرور الجامعي - خادم الواجهة الخلفية
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // للسماح بتحميل الموارد الخارجية
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static('.'));

// Database connection
const db = require('./db-config');

// Test database connection
db.testConnection()
    .then(() => console.log('✓ Database connected successfully'))
    .catch(err => console.error('✗ Database connection failed:', err.message));

// ============================================
// Authentication Routes
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'اسم المستخدم وكلمة المرور مطلوبان' 
            });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
            });
        }

        const user = result.rows[0];
        
        // في بيئة الإنتاج، استخدم bcrypt للتحقق من كلمة المرور
        // هنا نستخدم مقارنة بسيطة للتوافق مع النظام الحالي
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
            });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Return user info (without password)
        const { password_hash, ...userInfo } = user;
        res.json({ 
            success: true, 
            user: userInfo 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تسجيل الدخول' 
        });
    }
});

// ============================================
// Users Routes
// ============================================

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, full_name, email, phone, role, is_active, last_login, created_at FROM users ORDER BY id'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب المستخدمين' });
    }
});

// ============================================
// Violations Routes
// ============================================

// Get all violations
app.get('/api/violations', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM traffic_violations ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get violations error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب المخالفات' });
    }
});

// Add new violation
app.post('/api/violations', async (req, res) => {
    try {
        const {
            plate_number,
            violation_type,
            violation_date,
            violation_time,
            location,
            officer_name,
            notes
        } = req.body;

        // Generate violation number
        const violation_number = `V-${Date.now()}`;

        const result = await db.query(
            `INSERT INTO traffic_violations 
            (violation_number, plate_number, violation_type, violation_date, violation_time, location, officer_name, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [violation_number, plate_number, violation_type, violation_date, violation_time, location, officer_name, notes]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Add violation error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة المخالفة' });
    }
});

// ============================================
// Vehicles Routes
// ============================================

// Get all vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM vehicles ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب السيارات' });
    }
});

// ============================================
// Stickers Routes
// ============================================

// Get all stickers
app.get('/api/stickers', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM vehicle_stickers ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get stickers error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الملصقات' });
    }
});

// Add new sticker
app.post('/api/stickers', async (req, res) => {
    try {
        const {
            vehicle_id,
            resident_id,
            issue_date,
            expiry_date,
            license_number,
            notes
        } = req.body;

        const result = await db.query(
            `INSERT INTO vehicle_stickers 
            (vehicle_id, resident_id, issue_date, expiry_date, license_number, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [vehicle_id, resident_id, issue_date, expiry_date, license_number, notes]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Add sticker error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة الملصق' });
    }
});

// ============================================
// Buildings Routes
// ============================================

// Get all buildings
app.get('/api/buildings', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM buildings ORDER BY building_number'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get buildings error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب المباني' });
    }
});

// ============================================
// Residential Units Routes
// ============================================

// Get all residential units
app.get('/api/residential-units', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT ru.*, b.building_name 
             FROM residential_units ru
             LEFT JOIN buildings b ON ru.building_id = b.id
             ORDER BY ru.created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get residential units error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الوحدات السكنية' });
    }
});

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: db.isConnected() ? 'connected' : 'disconnected'
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: 'API endpoint not found' });
    } else {
        res.status(404).sendFile(__dirname + '/index.html');
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'حدث خطأ في الخادم' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎓 University Traffic Management System                  ║
║  نظام إدارة المرور الجامعي                               ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                ║
║  API Endpoint: http://localhost:${PORT}/api                 ║
║  Database: ${process.env.DATABASE_URL ? 'Cloud Database' : 'Not Configured'}                                  ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
