/**
 * University Traffic Management System - Backend Server
 * نظام إدارة المرور الجامعي - خادم الواجهة الخلفية
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'violation-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('فقط الصور مسموح بها (JPEG, JPG, PNG, GIF)'));
        }
    }
});

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
app.use('/uploads', express.static(uploadsDir));

// Database connection
const db = require('./db-config');

// ============================================
// Audit Logging Middleware
// ============================================
async function logAuditActivity(userId, username, actionType, actionDescription, entityType = null, entityId = null, req = null) {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
        const userAgent = req ? req.headers['user-agent'] : null;
        
        await db.query(
            `INSERT INTO audit_logs (user_id, username, action_type, action_description, entity_type, entity_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, username, actionType, actionDescription, entityType, entityId, ipAddress, userAgent]
        );
    } catch (error) {
        console.error('Error logging audit activity:', error);
    }
}

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
            // Log failed login attempt
            await logAuditActivity(null, username, 'LOGIN_FAILED', 'محاولة تسجيل دخول فاشلة', null, null, req);
            
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
            // Log failed login attempt
            await logAuditActivity(user.id, username, 'LOGIN_FAILED', 'كلمة مرور غير صحيحة', null, null, req);
            
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

        // Log successful login
        await logAuditActivity(user.id, username, 'LOGIN_SUCCESS', 'تسجيل دخول ناجح', 'user', user.id, req);

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
// Audit Logs Routes
// ============================================

// Get all audit logs
app.get('/api/audit-logs', async (req, res) => {
    try {
        const { page = 1, limit = 50, user_id, action_type, entity_type } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (user_id) {
            query += ` AND user_id = $${paramCount}`;
            params.push(user_id);
            paramCount++;
        }
        
        if (action_type) {
            query += ` AND action_type = $${paramCount}`;
            params.push(action_type);
            paramCount++;
        }
        
        if (entity_type) {
            query += ` AND entity_type = $${paramCount}`;
            params.push(entity_type);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        // Get total count
        const countResult = await db.query('SELECT COUNT(*) FROM audit_logs');
        const total = parseInt(countResult.rows[0].count);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب سجلات الأنشطة' });
    }
});

// ============================================
// Violation Images Routes
// ============================================

// Upload violation image
app.post('/api/violations/:id/images', upload.single('image'), async (req, res) => {
    try {
        const violationId = req.params.id;
        const userId = req.body.user_id || null;
        const notes = req.body.notes || null;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم رفع أي صورة' });
        }
        
        // Check if violation exists
        const violationCheck = await db.query(
            'SELECT id FROM traffic_violations WHERE id = $1',
            [violationId]
        );
        
        if (violationCheck.rows.length === 0) {
            // Delete uploaded file asynchronously
            await fs.promises.unlink(req.file.path).catch(err => {
                console.error('Error deleting file:', err);
            });
            return res.status(404).json({ success: false, message: 'المخالفة غير موجودة' });
        }
        
        // Save image info to database
        const result = await db.query(
            `INSERT INTO violation_images 
            (violation_id, image_path, image_url, file_size, mime_type, uploaded_by, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                violationId,
                req.file.path,
                `/uploads/${req.file.filename}`,
                req.file.size,
                req.file.mimetype,
                userId,
                notes
            ]
        );
        
        // Log audit activity
        await logAuditActivity(userId, req.body.username || 'system', 'IMAGE_UPLOAD', `تحميل صورة للمخالفة رقم ${violationId}`, 'violation', violationId, req);
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Upload image error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(err => {
                console.error('Error deleting file:', err);
            });
        }
        res.status(500).json({ success: false, message: 'خطأ في رفع الصورة' });
    }
});

// Get images for a violation
app.get('/api/violations/:id/images', async (req, res) => {
    try {
        const violationId = req.params.id;
        
        const result = await db.query(
            'SELECT * FROM violation_images WHERE violation_id = $1 ORDER BY upload_date DESC',
            [violationId]
        );
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get violation images error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب صور المخالفة' });
    }
});

// Delete violation image
app.delete('/api/violations/:violationId/images/:imageId', async (req, res) => {
    try {
        const { violationId, imageId } = req.params;
        const userId = req.body.user_id || null;
        
        // Get image info
        const imageResult = await db.query(
            'SELECT * FROM violation_images WHERE id = $1 AND violation_id = $2',
            [imageId, violationId]
        );
        
        if (imageResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الصورة غير موجودة' });
        }
        
        const image = imageResult.rows[0];
        
        // Delete from database
        await db.query('DELETE FROM violation_images WHERE id = $1', [imageId]);
        
        // Delete file from disk asynchronously
        if (fs.existsSync(image.image_path)) {
            await fs.promises.unlink(image.image_path).catch(err => {
                console.error('Error deleting file:', err);
            });
        }
        
        // Log audit activity
        await logAuditActivity(userId, req.body.username || 'system', 'IMAGE_DELETE', `حذف صورة من المخالفة رقم ${violationId}`, 'violation', violationId, req);
        
        res.json({ success: true, message: 'تم حذف الصورة بنجاح' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف الصورة' });
    }
});

// ============================================
// Advanced Search Routes
// ============================================

// Advanced search for violations
app.post('/api/violations/search', async (req, res) => {
    try {
        const {
            plate_number,
            violation_type,
            date_from,
            date_to,
            location,
            status,
            officer_name,
            page = 1,
            limit = 50
        } = req.body;
        
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM traffic_violations WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (plate_number) {
            query += ` AND plate_number ILIKE $${paramCount}`;
            params.push(`%${plate_number}%`);
            paramCount++;
        }
        
        if (violation_type) {
            query += ` AND violation_type = $${paramCount}`;
            params.push(violation_type);
            paramCount++;
        }
        
        if (date_from) {
            query += ` AND violation_date >= $${paramCount}`;
            params.push(date_from);
            paramCount++;
        }
        
        if (date_to) {
            query += ` AND violation_date <= $${paramCount}`;
            params.push(date_to);
            paramCount++;
        }
        
        if (location) {
            query += ` AND location ILIKE $${paramCount}`;
            params.push(`%${location}%`);
            paramCount++;
        }
        
        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (officer_name) {
            query += ` AND officer_name ILIKE $${paramCount}`;
            params.push(`%${officer_name}%`);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        // Get total count with same filters (build query dynamically)
        let countQuery = 'SELECT COUNT(*) FROM traffic_violations WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;
        
        if (plate_number) {
            countQuery += ` AND plate_number ILIKE $${countParamIndex}`;
            countParams.push(`%${plate_number}%`);
            countParamIndex++;
        }
        
        if (violation_type) {
            countQuery += ` AND violation_type = $${countParamIndex}`;
            countParams.push(violation_type);
            countParamIndex++;
        }
        
        if (date_from) {
            countQuery += ` AND violation_date >= $${countParamIndex}`;
            countParams.push(date_from);
            countParamIndex++;
        }
        
        if (date_to) {
            countQuery += ` AND violation_date <= $${countParamIndex}`;
            countParams.push(date_to);
            countParamIndex++;
        }
        
        if (location) {
            countQuery += ` AND location ILIKE $${countParamIndex}`;
            countParams.push(`%${location}%`);
            countParamIndex++;
        }
        
        if (status) {
            countQuery += ` AND status = $${countParamIndex}`;
            countParams.push(status);
            countParamIndex++;
        }
        
        if (officer_name) {
            countQuery += ` AND officer_name ILIKE $${countParamIndex}`;
            countParams.push(`%${officer_name}%`);
            countParamIndex++;
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);
        
        res.json({ 
            success: true, 
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({ success: false, message: 'خطأ في البحث المتقدم' });
    }
});

// Advanced search for vehicles
app.post('/api/vehicles/search', async (req, res) => {
    try {
        const {
            plate_number,
            owner_name,
            vehicle_type,
            color,
            page = 1,
            limit = 50
        } = req.body;
        
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (plate_number) {
            query += ` AND plate_number ILIKE $${paramCount}`;
            params.push(`%${plate_number}%`);
            paramCount++;
        }
        
        if (owner_name) {
            query += ` AND owner_name ILIKE $${paramCount}`;
            params.push(`%${owner_name}%`);
            paramCount++;
        }
        
        if (vehicle_type) {
            query += ` AND vehicle_type = $${paramCount}`;
            params.push(vehicle_type);
            paramCount++;
        }
        
        if (color) {
            query += ` AND color ILIKE $${paramCount}`;
            params.push(`%${color}%`);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Vehicle search error:', error);
        res.status(500).json({ success: false, message: 'خطأ في البحث عن السيارات' });
    }
});

// Advanced search for users
app.post('/api/users/search', async (req, res) => {
    try {
        const {
            username,
            full_name,
            email,
            role,
            is_active,
            page = 1,
            limit = 50
        } = req.body;
        
        const offset = (page - 1) * limit;
        
        let query = 'SELECT id, username, full_name, email, phone, role, is_active, last_login, created_at FROM users WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (username) {
            query += ` AND username ILIKE $${paramCount}`;
            params.push(`%${username}%`);
            paramCount++;
        }
        
        if (full_name) {
            query += ` AND full_name ILIKE $${paramCount}`;
            params.push(`%${full_name}%`);
            paramCount++;
        }
        
        if (email) {
            query += ` AND email ILIKE $${paramCount}`;
            params.push(`%${email}%`);
            paramCount++;
        }
        
        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }
        
        if (is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ success: false, message: 'خطأ في البحث عن المستخدمين' });
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
