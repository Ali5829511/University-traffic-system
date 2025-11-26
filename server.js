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
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
require('dotenv').config();

// Import visits module
const visitsImporter = require('./jobs/import_visits_with_images_and_pdf');

const app = express();
const PORT = process.env.PORT || 3000;

// ثوابت النظام / System Constants
const PDF_EXPORT_LIMIT = 100; // الحد الأقصى لتصدير PDF / Limit PDF exports to prevent memory issues

// إنشاء مجلد التحميلات إذا لم يكن موجوداً / Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// إعداد multer لتحميل الملفات / Configure multer for file uploads
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
        fileSize: 5 * 1024 * 1024 // الحد الأقصى 5 ميجابايت / 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const imageTypes = /jpeg|jpg|png|gif/;
        const csvTypes = /csv/;
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Allow images
        if (imageTypes.test(ext) && imageTypes.test(file.mimetype)) {
            return cb(null, true);
        }
        
        // Allow CSV files
        if (csvTypes.test(ext) || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            return cb(null, true);
        }
        
        cb(new Error('فقط الصور (JPEG, JPG, PNG, GIF) أو ملفات CSV مسموح بها'));
    }
});

// الوسيطات / Middleware
app.use(helmet({
    contentSecurityPolicy: false, // للسماح بتحميل الموارد الخارجية
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تحديد معدل الطلبات للـ Webhook / Higher rate limit for webhooks
const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة / 15 minutes
    max: 1000, // الحد الأقصى 1000 طلب لكل عنوان IP للـ webhook / Higher limit for webhook endpoints
    message: { success: false, message: 'تم تجاوز الحد الأقصى للطلبات / Too many requests' }
});
app.use('/api/v1/webhook-receiver', webhookLimiter);

// تحديد معدل الطلبات / Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة / 15 minutes
    max: 100 // الحد الأقصى 100 طلب لكل عنوان IP / limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// خدمة الملفات الثابتة / Serve static files
app.use(express.static('.'));
app.use('/uploads', express.static(uploadsDir));

// اتصال قاعدة البيانات / Database connection
const db = require('./db-config');

// ============================================
// تسجيل الأنشطة / Audit Logging Middleware
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
        console.error('خطأ في تسجيل النشاط / Error logging audit activity:', error);
    }
}

// اختبار اتصال قاعدة البيانات / Test database connection
db.testConnection()
    .then(() => console.log('✓ قاعدة البيانات متصلة بنجاح / Database connected successfully'))
    .catch(err => console.error('✗ فشل اتصال قاعدة البيانات / Database connection failed:', err.message));

// ============================================
// مسارات المصادقة / Authentication Routes
// ============================================

// تسجيل الدخول / Login
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
// مسارات المستخدمين / Users Routes
// ============================================

// جلب جميع المستخدمين / Get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, full_name, email, phone, role, is_active, last_login, created_at FROM users ORDER BY id'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب المستخدمين / Get users error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب المستخدمين' });
    }
});

// ============================================
// مسارات المخالفات / Violations Routes
// ============================================

// جلب جميع المخالفات / Get all violations
app.get('/api/violations', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM traffic_violations ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب المخالفات / Get violations error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب المخالفات' });
    }
});

// إضافة مخالفة جديدة / Add new violation
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
// مسارات السيارات / Vehicles Routes
// ============================================

// جلب جميع السيارات / Get all vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM vehicles ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب السيارات / Get vehicles error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب السيارات' });
    }
});

// ============================================
// مسارات الملصقات / Stickers Routes
// ============================================

// جلب جميع الملصقات / Get all stickers
app.get('/api/stickers', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM vehicle_stickers ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب الملصقات / Get stickers error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الملصقات' });
    }
});

// إضافة ملصق جديد / Add new sticker
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
        console.error('خطأ في إضافة الملصق / Add sticker error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة الملصق' });
    }
});

// ============================================
// مسارات المباني / Buildings Routes
// ============================================

// جلب جميع المباني / Get all buildings
app.get('/api/buildings', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM buildings ORDER BY building_number'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب المباني / Get buildings error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب المباني' });
    }
});

// ============================================
// مسارات الوحدات السكنية / Residential Units Routes
// ============================================

// جلب جميع الوحدات السكنية / Get all residential units
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
        console.error('خطأ في جلب الوحدات السكنية / Get residential units error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الوحدات السكنية' });
    }
});

// ============================================
// مسارات سجلات الأنشطة / Audit Logs Routes
// ============================================

// جلب جميع سجلات الأنشطة / Get all audit logs
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
        
        // جلب إجمالي العدد / Get total count
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
        console.error('خطأ في جلب سجلات الأنشطة / Get audit logs error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب سجلات الأنشطة' });
    }
});

// ============================================
// مسارات الإحصائيات / Statistics Routes
// ============================================

// جلب إحصائيات النظام العامة / Get general system statistics
app.get('/api/stats', async (req, res) => {
    try {
        // جلب إحصائيات المركبات / Get vehicle stats
        const vehiclesResult = await db.query('SELECT COUNT(*) AS total_vehicles FROM vehicles');
        const totalVehicles = parseInt(vehiclesResult.rows[0].total_vehicles);

        // جلب إحصائيات المخالفات / Get violations stats
        const violationsResult = await db.query('SELECT COUNT(*) AS total_violations FROM traffic_violations');
        const totalViolations = parseInt(violationsResult.rows[0].total_violations);

        // جلب إحصائيات السكان / Get residents stats
        const residentsResult = await db.query('SELECT COUNT(*) AS total_residents FROM residents WHERE is_active = true');
        const totalResidents = parseInt(residentsResult.rows[0].total_residents);

        // جلب إحصائيات الوحدات السكنية / Get residential units stats
        const unitsResult = await db.query('SELECT COUNT(*) AS total_units FROM residential_units');
        const totalUnits = parseInt(unitsResult.rows[0].total_units);

        // جلب إحصائيات المخالفات النشطة / Get active violations
        const activeViolationsResult = await db.query(
            "SELECT COUNT(*) AS active_violations FROM traffic_violations WHERE violation_status IN ('جديد', 'قيد المراجعة')"
        );
        const activeViolations = parseInt(activeViolationsResult.rows[0].active_violations);

        // جلب إحصائيات المركبات المسجلة / Get registered vehicles
        const registeredVehiclesResult = await db.query('SELECT COUNT(*) AS registered_vehicles FROM vehicles WHERE is_registered = true');
        const registeredVehicles = parseInt(registeredVehiclesResult.rows[0].registered_vehicles);

        res.json({
            success: true,
            data: {
                totalVehicles,
                totalViolations,
                totalResidents,
                totalUnits,
                activeViolations,
                registeredVehicles
            }
        });
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات / Get stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الإحصائيات' });
    }
});

// جلب إحصائيات المخالفات حسب المركبة / Get violation statistics by vehicle
app.get('/api/stats/violations', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                v.plate_number,
                v.vehicle_make,
                v.vehicle_model,
                COUNT(tv.id) AS violation_count,
                COALESCE(SUM(tv.fine_amount), 0) AS total_fines,
                MAX(tv.violation_date) AS last_violation
            FROM vehicles v
            LEFT JOIN traffic_violations tv ON v.plate_number = tv.plate_number
            GROUP BY v.id, v.plate_number, v.vehicle_make, v.vehicle_model
            HAVING COUNT(tv.id) > 0
            ORDER BY violation_count DESC
            LIMIT 50
        `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات المخالفات / Get violation stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب إحصائيات المخالفات' });
    }
});

// جلب إحصائيات المخالفات حسب النوع / Get violation statistics by type
app.get('/api/stats/violations/by-type', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                violation_type,
                COUNT(*) AS count,
                COALESCE(SUM(fine_amount), 0) AS total_fines,
                COALESCE(AVG(fine_amount), 0) AS avg_fine
            FROM traffic_violations
            GROUP BY violation_type
            ORDER BY count DESC
        `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات أنواع المخالفات / Get violation type stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب إحصائيات أنواع المخالفات' });
    }
});

// جلب إحصائيات المخالفات الشهرية / Get monthly violation statistics
app.get('/api/stats/violations/monthly', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                TO_CHAR(violation_date, 'YYYY-MM') AS month,
                COUNT(*) AS count,
                COALESCE(SUM(fine_amount), 0) AS total_fines
            FROM traffic_violations
            WHERE violation_date >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(violation_date, 'YYYY-MM')
            ORDER BY month DESC
        `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات الشهرية / Get monthly stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الإحصائيات الشهرية' });
    }
});

// جلب جميع إحصائيات المخالفات المحفوظة / Get all saved violation statistics
app.get('/api/violation-stats', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT vs.*, v.plate_number, v.vehicle_make, v.vehicle_model
            FROM violation_stats vs
            LEFT JOIN vehicles v ON vs.vehicle_id = v.id
            ORDER BY vs.total_count DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات المخالفات / Get violation stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب إحصائيات المخالفات' });
    }
});

// تحديث/إضافة إحصائيات مخالفة / Update/Add violation statistics
app.post('/api/violation-stats', async (req, res) => {
    try {
        const { vehicle_id, violation_type, count_increment = 1, fine_amount = 0 } = req.body;

        if (!vehicle_id || !violation_type) {
            return res.status(400).json({ success: false, message: 'معرف المركبة ونوع المخالفة مطلوبان' });
        }

        // حساب متوسط الغرامة بشكل صحيح / Calculate avg_fine correctly
        // للسجل الجديد: avg_fine = fine_amount / count_increment
        const initialAvgFine = count_increment > 0 ? fine_amount / count_increment : 0;

        const result = await db.query(`
            INSERT INTO violation_stats (vehicle_id, violation_type, total_count, total_fines, avg_fine, last_violation)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (vehicle_id, violation_type) 
            DO UPDATE SET 
                total_count = violation_stats.total_count + $3,
                total_fines = violation_stats.total_fines + $4,
                avg_fine = (violation_stats.total_fines + $4) / NULLIF(violation_stats.total_count + $3, 0),
                last_violation = NOW(),
                updated_at = NOW()
            RETURNING *
        `, [vehicle_id, violation_type, count_increment, fine_amount, initialAvgFine]);

        res.json({ success: true, data: result.rows[0], message: 'تم تحديث الإحصائيات بنجاح' });
    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات / Update stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث الإحصائيات' });
    }
});

// ============================================
// مسارات صور المخالفات / Violation Images Routes
// ============================================

// رفع صورة مخالفة / Upload violation image
app.post('/api/violations/:id/images', upload.single('image'), async (req, res) => {
    try {
        const violationId = req.params.id;
        const userId = req.body.user_id || null;
        const notes = req.body.notes || null;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم رفع أي صورة' });
        }
        
        // التحقق من وجود المخالفة / Check if violation exists
        const violationCheck = await db.query(
            'SELECT id FROM traffic_violations WHERE id = $1',
            [violationId]
        );
        
        if (violationCheck.rows.length === 0) {
            // حذف الملف المرفوع / Delete uploaded file asynchronously
            await fs.promises.unlink(req.file.path).catch(err => {
                console.error('خطأ في حذف الملف / Error deleting file:', err);
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
// مسارات البحث المتقدم / Advanced Search Routes
// ============================================

// البحث المتقدم عن المخالفات / Advanced search for violations
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
            query += ` AND violation_status = $${paramCount}`;
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
        
        // جلب إجمالي العدد بنفس الفلاتر / Get total count with same filters
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
            countQuery += ` AND violation_status = $${countParamIndex}`;
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

// البحث المتقدم عن السيارات / Advanced search for vehicles
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
        console.error('خطأ في البحث عن السيارات / Vehicle search error:', error);
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
        console.error('خطأ في البحث عن المستخدمين / User search error:', error);
        res.status(500).json({ success: false, message: 'خطأ في البحث عن المستخدمين' });
    }
});

// ============================================
// مسارات التصدير / Export Routes
// ============================================

// تصدير المخالفات إلى Excel / Export violations to Excel
app.post('/api/export/violations/excel', async (req, res) => {
    try {
        const {
            plate_number,
            violation_type,
            date_from,
            date_to,
            location,
            status,
            officer_name
        } = req.body;
        
        // بناء الاستعلام مع الفلاتر / Build query with filters
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
            query += ` AND violation_status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (officer_name) {
            query += ` AND officer_name ILIKE $${paramCount}`;
            params.push(`%${officer_name}%`);
            paramCount++;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await db.query(query, params);
        const violations = result.rows;
        
        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const excelData = violations.map((v, index) => ({
            'م': index + 1,
            'رقم المخالفة': v.violation_number || '',
            'رقم اللوحة': v.plate_number || '',
            'نوع المخالفة': v.violation_type || '',
            'تاريخ المخالفة': v.violation_date ? new Date(v.violation_date).toLocaleDateString('ar-SA') : '',
            'وقت المخالفة': v.violation_time || '',
            'الموقع': v.location || '',
            'الحالة': v.violation_status || '',
            'المبلغ': v.fine_amount || 0,
            'مدفوعة': v.is_paid ? 'نعم' : 'لا',
            'اسم الضابط': v.officer_name || '',
            'ملاحظات': v.notes || ''
        }));
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المخالفات');
        
        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=violations_${Date.now()}.xlsx`);
        
        // Send buffer
        res.send(buffer);
    } catch (error) {
        console.error('Export to Excel error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تصدير البيانات إلى Excel' });
    }
});

// Export violations to PDF
app.post('/api/export/violations/pdf', async (req, res) => {
    try {
        const {
            plate_number,
            violation_type,
            date_from,
            date_to,
            location,
            status,
            officer_name
        } = req.body;
        
        // Build query with filters
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
            query += ` AND violation_status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (officer_name) {
            query += ` AND officer_name ILIKE $${paramCount}`;
            params.push(`%${officer_name}%`);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT ${PDF_EXPORT_LIMIT}`; // Limit to prevent memory issues with large datasets
        
        const result = await db.query(query, params);
        const violations = result.rows;
        
        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=violations_${Date.now()}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add title
        doc.fontSize(20).text('تقرير المخالفات المرورية', { align: 'center' });
        doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, { align: 'center' });
        doc.fontSize(10).text('وحدة إسكان هيئة التدريس - جامعة الإمام محمد بن سعود الإسلامية', { align: 'center' });
        doc.moveDown(2);
        
        // Add violations
        violations.forEach((v, index) => {
            if (index > 0) {
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);
            }
            
            doc.fontSize(10);
            doc.text(`${index + 1}. رقم المخالفة: ${v.violation_number || 'غير متوفر'}`, { continued: false });
            doc.text(`   رقم اللوحة: ${v.plate_number || 'غير متوفر'}`, { continued: false });
            doc.text(`   نوع المخالفة: ${v.violation_type || 'غير متوفر'}`, { continued: false });
            doc.text(`   التاريخ: ${v.violation_date ? new Date(v.violation_date).toLocaleDateString('ar-SA') : 'غير متوفر'}`, { continued: false });
            doc.text(`   الموقع: ${v.location || 'غير متوفر'}`, { continued: false });
            doc.text(`   الحالة: ${v.violation_status || 'غير متوفر'}`, { continued: false });
            
            // Check if we need a new page
            if (doc.y > PDF_PAGE_HEIGHT_LIMIT) {
                doc.addPage();
            }
        });
        
        // Add footer
        doc.moveDown(2);
        doc.fontSize(8).text(`إجمالي المخالفات: ${violations.length}`, { align: 'center' });
        doc.text('تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المرور', { align: 'center' });
        
        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Export to PDF error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تصدير البيانات إلى PDF' });
    }
});

// Export vehicles to Excel
app.post('/api/export/vehicles/excel', async (req, res) => {
    try {
        const { plate_number, owner_name, vehicle_type, color } = req.body;
        
        // Build query with filters
        let query = 'SELECT v.*, r.full_name as owner_name FROM vehicles v LEFT JOIN residents r ON v.resident_id = r.id WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (plate_number) {
            query += ` AND v.plate_number ILIKE $${paramCount}`;
            params.push(`%${plate_number}%`);
            paramCount++;
        }
        
        if (owner_name) {
            query += ` AND r.full_name ILIKE $${paramCount}`;
            params.push(`%${owner_name}%`);
            paramCount++;
        }
        
        if (vehicle_type) {
            query += ` AND v.vehicle_type = $${paramCount}`;
            params.push(vehicle_type);
            paramCount++;
        }
        
        if (color) {
            query += ` AND v.vehicle_color ILIKE $${paramCount}`;
            params.push(`%${color}%`);
            paramCount++;
        }
        
        query += ' ORDER BY v.created_at DESC';
        
        const result = await db.query(query, params);
        const vehicles = result.rows;
        
        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const excelData = vehicles.map((v, index) => ({
            'م': index + 1,
            'رقم اللوحة': v.plate_number || '',
            'اسم المالك': v.owner_name || '',
            'نوع المركبة': v.vehicle_type || '',
            'الصنع': v.vehicle_make || '',
            'الموديل': v.vehicle_model || '',
            'السنة': v.vehicle_year || '',
            'اللون': v.vehicle_color || '',
            'مسجلة': v.is_registered ? 'نعم' : 'لا',
            'تاريخ التسجيل': v.registration_date ? new Date(v.registration_date).toLocaleDateString('ar-SA') : '',
            'ملاحظات': v.notes || ''
        }));
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'السيارات');
        
        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=vehicles_${Date.now()}.xlsx`);
        
        // Send buffer
        res.send(buffer);
    } catch (error) {
        console.error('Export vehicles to Excel error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تصدير بيانات السيارات إلى Excel' });
    }
});

// Export users to Excel
app.post('/api/export/users/excel', async (req, res) => {
    try {
        const { username, full_name, email, role, is_active } = req.body;
        
        // Build query with filters
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
        
        query += ' ORDER BY created_at DESC';
        
        const result = await db.query(query, params);
        const users = result.rows;
        
        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const excelData = users.map((u, index) => ({
            'م': index + 1,
            'اسم المستخدم': u.username || '',
            'الاسم الكامل': u.full_name || '',
            'البريد الإلكتروني': u.email || '',
            'الهاتف': u.phone || '',
            'الدور': u.role || '',
            'نشط': u.is_active ? 'نعم' : 'لا',
            'آخر تسجيل دخول': u.last_login ? new Date(u.last_login).toLocaleString('ar-SA') : '',
            'تاريخ الإنشاء': u.created_at ? new Date(u.created_at).toLocaleDateString('ar-SA') : ''
        }));
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المستخدمين');
        
        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.xlsx`);
        
        // Send buffer
        res.send(buffer);
    } catch (error) {
        console.error('خطأ في تصدير بيانات المستخدمين / Export users to Excel error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تصدير بيانات المستخدمين إلى Excel' });
    }
});

// Export vehicles to PDF
app.post('/api/export/vehicles/pdf', async (req, res) => {
    try {
        const { plate_number, owner_name, vehicle_type, color } = req.body;
        
        // Build query with filters
        let query = 'SELECT v.*, r.full_name as owner_name FROM vehicles v LEFT JOIN residents r ON v.resident_id = r.id WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (plate_number) {
            query += ` AND v.plate_number ILIKE $${paramCount}`;
            params.push(`%${plate_number}%`);
            paramCount++;
        }
        
        if (owner_name) {
            query += ` AND r.full_name ILIKE $${paramCount}`;
            params.push(`%${owner_name}%`);
            paramCount++;
        }
        
        if (vehicle_type) {
            query += ` AND v.vehicle_type = $${paramCount}`;
            params.push(vehicle_type);
            paramCount++;
        }
        
        if (color) {
            query += ` AND v.vehicle_color ILIKE $${paramCount}`;
            params.push(`%${color}%`);
            paramCount++;
        }
        
        query += ` ORDER BY v.created_at DESC LIMIT $${paramCount}`;
        params.push(PDF_EXPORT_LIMIT);
        
        const result = await db.query(query, params);
        const vehicles = result.rows;
        
        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=vehicles_${Date.now()}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add title
        doc.fontSize(20).text('تقرير السيارات المسجلة', { align: 'center' });
        doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, { align: 'center' });
        doc.fontSize(10).text('وحدة إسكان هيئة التدريس - جامعة الإمام محمد بن سعود الإسلامية', { align: 'center' });
        doc.moveDown(2);
        
        // Add vehicles
        vehicles.forEach((v, index) => {
            if (index > 0) {
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);
            }
            
            doc.fontSize(10);
            doc.text(`${index + 1}. رقم اللوحة: ${v.plate_number || 'غير متوفر'}`, { continued: false });
            doc.text(`   اسم المالك: ${v.owner_name || 'غير متوفر'}`, { continued: false });
            doc.text(`   نوع المركبة: ${v.vehicle_type || 'غير متوفر'}`, { continued: false });
            doc.text(`   الصنع: ${v.vehicle_make || 'غير متوفر'}`, { continued: false });
            doc.text(`   الموديل: ${v.vehicle_model || 'غير متوفر'}`, { continued: false });
            doc.text(`   اللون: ${v.vehicle_color || 'غير متوفر'}`, { continued: false });
            
            // Check if we need a new page
            if (doc.y > PDF_PAGE_HEIGHT_LIMIT) {
                doc.addPage();
            }
        });
        
        // Add footer
        doc.moveDown(2);
        doc.fontSize(8).text(`إجمالي السيارات: ${vehicles.length}`, { align: 'center' });
        doc.text('تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المرور', { align: 'center' });
        
        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Export vehicles to PDF error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تصدير بيانات السيارات إلى PDF' });
    }
});

// Export users to PDF
app.post('/api/export/users/pdf', async (req, res) => {
    try {
        const { username, full_name, email, role, is_active } = req.body;
        
        // Build query with filters
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
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        params.push(PDF_EXPORT_LIMIT);
        
        const result = await db.query(query, params);
        const users = result.rows;
        
        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add title
        doc.fontSize(20).text('تقرير المستخدمين', { align: 'center' });
        doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, { align: 'center' });
        doc.fontSize(10).text('وحدة إسكان هيئة التدريس - جامعة الإمام محمد بن سعود الإسلامية', { align: 'center' });
        doc.moveDown(2);
        
        const roleNames = {
            'admin': 'مدير النظام',
            'violations_officer': 'مسجل المخالفات',
            'inquiry_user': 'موظف الاستعلام',
            'manager': 'مدير'
        };
        
        // Add users
        users.forEach((u, index) => {
            if (index > 0) {
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);
            }
            
            doc.fontSize(10);
            doc.text(`${index + 1}. اسم المستخدم: ${u.username || 'غير متوفر'}`, { continued: false });
            doc.text(`   الاسم الكامل: ${u.full_name || 'غير متوفر'}`, { continued: false });
            doc.text(`   البريد الإلكتروني: ${u.email || 'غير متوفر'}`, { continued: false });
            doc.text(`   الهاتف: ${u.phone || 'غير متوفر'}`, { continued: false });
            doc.text(`   الدور: ${roleNames[u.role] || u.role || 'غير متوفر'}`, { continued: false });
            doc.text(`   الحالة: ${u.is_active ? 'نشط' : 'غير نشط'}`, { continued: false });
            
            // Check if we need a new page
            if (doc.y > PDF_PAGE_HEIGHT_LIMIT) {
                doc.addPage();
            }
        });
        
        // Add footer
        doc.moveDown(2);
        doc.fontSize(8).text(`إجمالي المستخدمين: ${users.length}`, { align: 'center' });
        doc.text('تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المرور', { align: 'center' });
        
        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Export users to PDF error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تصدير بيانات المستخدمين إلى PDF' });
    }
});

// ============================================
// مسارات استيراد الزيارات / Import Visits Routes
// ============================================

// استيراد الزيارات من CSV وتوليد PDF / Import visits from CSV and generate PDF
app.post('/api/import/visits', upload.single('csv'), async (req, res) => {
    const tempFilePath = req.file ? req.file.path : null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف CSV' });
        }
        
        // Run import with uploaded file using pre-loaded module
        const result = await visitsImporter.run(tempFilePath);
        
        // Clean up uploaded file asynchronously
        if (fs.existsSync(tempFilePath)) {
            await fs.promises.unlink(tempFilePath).catch(err => {
                console.error('Error cleaning up temp file:', err);
            });
        }
        
        if (result.success) {
            res.json({
                success: true,
                message: 'تم استيراد الزيارات بنجاح',
                data: {
                    recordsImported: result.recordsImported,
                    imagesDownloaded: result.imagesDownloaded,
                    imagesFailed: result.imagesFailed,
                    excelFile: result.excelFile ? path.basename(result.excelFile) : null,
                    pdfFile: result.pdfFile ? path.basename(result.pdfFile) : null
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'فشل استيراد الزيارات'
            });
        }
    } catch (error) {
        console.error('Import visits error:', error);
        // Clean up temp file on error
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            await fs.promises.unlink(tempFilePath).catch(err => {
                console.error('Error cleaning up temp file:', err);
            });
        }
        res.status(500).json({ success: false, message: 'خطأ في استيراد الزيارات: ' + error.message });
    }
});

// Download generated report files
app.get('/api/import/reports/:filename', (req, res) => {
    const filename = req.params.filename;
    const resultsDir = path.resolve(__dirname, 'data', 'results');
    const filePath = path.resolve(resultsDir, filename);
    
    // Security: ensure the file is within the results directory using resolved paths
    if (!filePath.startsWith(resultsDir + path.sep) && filePath !== resultsDir) {
        return res.status(403).json({ success: false, message: 'الوصول مرفوض' });
    }
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'الملف غير موجود' });
    }
    
    res.download(filePath);
});

// ============================================
// مستقبل Webhook / Webhook Receiver Routes
// ============================================

// استقبال بيانات Webhook عبر POST / Receive webhook data via POST
app.post('/api/v1/webhook-receiver', async (req, res) => {
    try {
        const webhookData = req.body;
        
        // تسجيل البيانات المستلمة / Log received data
        console.log('📥 تم استلام Webhook جديد / New webhook received:', JSON.stringify(webhookData, null, 2));
        
        // استخراج بيانات اللوحة إن وجدت / Extract plate data if available
        const plateNumber = webhookData.plate_number || 
                           webhookData.plate || 
                           (webhookData.results && webhookData.results[0] && webhookData.results[0].plate) ||
                           null;
        
        const confidence = webhookData.confidence ||
                          (webhookData.results && webhookData.results[0] && webhookData.results[0].score) ||
                          null;
        
        // تسجيل النشاط / Log activity
        await logAuditActivity(null, 'webhook', 'WEBHOOK_RECEIVED', 
            `تم استلام بيانات Webhook${plateNumber ? ': لوحة ' + plateNumber : ''}`, 
            'webhook', null, req);
        
        // إرجاع استجابة ناجحة / Return success response
        res.json({
            success: true,
            message: 'تم استلام البيانات بنجاح / Data received successfully',
            received_at: new Date().toISOString(),
            data: {
                plate_number: plateNumber,
                confidence: confidence
            }
        });
    } catch (error) {
        console.error('خطأ في معالجة Webhook / Webhook processing error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في معالجة البيانات / Error processing data'
        });
    }
});

// صفحة معلومات Webhook عبر GET / Webhook info page via GET
app.get('/api/v1/webhook-receiver', (req, res) => {
    res.json({
        success: true,
        message: 'مستقبل Webhook جاهز / Webhook receiver is ready',
        description: 'استخدم طريقة POST لإرسال بيانات Webhook / Use POST method to send webhook data',
        allowed_methods: ['GET', 'POST', 'OPTIONS'],
        example_payload: {
            plate_number: 'ABC 1234',
            confidence: 0.95,
            timestamp: new Date().toISOString(),
            image_url: 'https://example.com/image.jpg'
        },
        endpoints: {
            webhook_receiver: '/api/v1/webhook-receiver',
            health_check: '/api/health'
        }
    });
});

// ============================================
// فحص حالة النظام / Health Check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: db.isConnected() ? 'متصل' : 'غير متصل'
    });
});

// معالج الصفحات غير الموجودة / 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: 'نقطة النهاية غير موجودة / API endpoint not found' });
    } else {
        res.status(404).sendFile(__dirname + '/index.html');
    }
});

// معالج الأخطاء / Error handler
app.use((err, req, res, next) => {
    console.error('خطأ في الخادم / Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'حدث خطأ في الخادم' 
    });
});

// بدء تشغيل الخادم / Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎓 نظام إدارة المرور الجامعي                             ║
║  University Traffic Management System                      ║
╠════════════════════════════════════════════════════════════╣
║  الخادم يعمل على: http://localhost:${PORT}                  ║
║  نقطة API: http://localhost:${PORT}/api                      ║
║  قاعدة البيانات: ${process.env.DATABASE_URL ? 'سحابية متصلة' : 'غير مهيأة'}                              ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
