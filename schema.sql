-- ============================================
-- مخطط قاعدة البيانات - نظام إدارة المرور
-- وحدة إسكان هيئة التدريس
-- جامعة الإمام محمد بن سعود الإسلامية
-- ============================================

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS traffic_management_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE traffic_management_system;

-- ============================================
-- 1. جدول المباني (Buildings)
-- ============================================
CREATE TABLE IF NOT EXISTS buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_number VARCHAR(10) NOT NULL UNIQUE COMMENT 'رقم المبنى',
    building_name VARCHAR(100) NOT NULL COMMENT 'اسم المبنى',
    building_type ENUM('عمارة', 'فلة') NOT NULL COMMENT 'نوع المبنى',
    building_category ENUM('قديم', 'جديد', 'فلل') NOT NULL COMMENT 'فئة المبنى',
    total_units INT NOT NULL DEFAULT 0 COMMENT 'إجمالي الوحدات',
    occupied_units INT NOT NULL DEFAULT 0 COMMENT 'الوحدات المشغولة',
    vacant_units INT NOT NULL DEFAULT 0 COMMENT 'الوحدات الشاغرة',
    total_parking INT NOT NULL DEFAULT 0 COMMENT 'إجمالي المواقف',
    location VARCHAR(200) COMMENT 'الموقع',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_building_type (building_type),
    INDEX idx_building_category (building_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المباني';

-- ============================================
-- 2. جدول الوحدات السكنية (Residential Units)
-- ============================================
CREATE TABLE IF NOT EXISTS residential_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL COMMENT 'معرف المبنى',
    unit_number VARCHAR(10) NOT NULL COMMENT 'رقم الوحدة/الشقة',
    unit_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'اسم الوحدة الكامل',
    unit_type ENUM('شقة', 'فلة') NOT NULL COMMENT 'نوع الوحدة',
    floor_number INT COMMENT 'رقم الطابق',
    is_occupied BOOLEAN DEFAULT FALSE COMMENT 'هل الوحدة مشغولة',
    occupancy_status ENUM('شاغر', 'مشغول') DEFAULT 'شاغر' COMMENT 'حالة الإشغال',
    area_sqm DECIMAL(10,2) COMMENT 'المساحة بالمتر المربع',
    rooms_count INT COMMENT 'عدد الغرف',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    INDEX idx_building_unit (building_id, unit_number),
    INDEX idx_occupancy (is_occupied),
    INDEX idx_unit_type (unit_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الوحدات السكنية';

-- ============================================
-- 3. جدول السكان (Residents)
-- ============================================
CREATE TABLE IF NOT EXISTS residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(20) NOT NULL UNIQUE COMMENT 'رقم الهوية الوطنية',
    full_name VARCHAR(200) NOT NULL COMMENT 'الاسم الكامل',
    phone VARCHAR(20) COMMENT 'رقم الهاتف',
    email VARCHAR(100) COMMENT 'البريد الإلكتروني',
    unit_id INT COMMENT 'معرف الوحدة السكنية',
    job_title VARCHAR(100) COMMENT 'المسمى الوظيفي',
    department VARCHAR(100) COMMENT 'القسم',
    family_members INT DEFAULT 1 COMMENT 'عدد أفراد الأسرة',
    move_in_date DATE COMMENT 'تاريخ السكن',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES residential_units(id) ON DELETE SET NULL,
    INDEX idx_national_id (national_id),
    INDEX idx_unit_id (unit_id),
    INDEX idx_active (is_active),
    INDEX idx_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول السكان';

-- ============================================
-- 4. جدول المواقف (Parking Spaces)
-- ============================================
CREATE TABLE IF NOT EXISTS parking_spaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parking_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'رقم الموقف',
    parking_type ENUM('خاص', 'عام', 'معاقين') NOT NULL COMMENT 'نوع الموقف',
    parking_zone VARCHAR(50) COMMENT 'منطقة الموقف',
    building_id INT COMMENT 'معرف المبنى (للمواقف الخاصة)',
    unit_id INT COMMENT 'معرف الوحدة (للمواقف الخاصة)',
    is_occupied BOOLEAN DEFAULT FALSE COMMENT 'هل الموقف مشغول',
    location_description VARCHAR(200) COMMENT 'وصف الموقع',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
    FOREIGN KEY (unit_id) REFERENCES residential_units(id) ON DELETE SET NULL,
    INDEX idx_parking_type (parking_type),
    INDEX idx_building (building_id),
    INDEX idx_occupied (is_occupied),
    INDEX idx_zone (parking_zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المواقف';

-- ============================================
-- 5. جدول السيارات (Vehicles)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL COMMENT 'رقم اللوحة (بالإنجليزية)',
    plate_number_ar VARCHAR(20) COMMENT 'رقم اللوحة (بالعربية)',
    resident_id INT COMMENT 'معرف الساكن',
    vehicle_make VARCHAR(50) COMMENT 'صانع السيارة',
    vehicle_model VARCHAR(50) COMMENT 'موديل السيارة',
    vehicle_year INT COMMENT 'سنة الصنع',
    vehicle_color VARCHAR(30) COMMENT 'لون السيارة',
    vehicle_type VARCHAR(30) COMMENT 'نوع المركبة',
    parking_id INT COMMENT 'معرف الموقف المخصص',
    is_registered BOOLEAN DEFAULT FALSE COMMENT 'هل السيارة مسجلة',
    registration_date DATE COMMENT 'تاريخ التسجيل',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL,
    FOREIGN KEY (parking_id) REFERENCES parking_spaces(id) ON DELETE SET NULL,
    INDEX idx_plate_number (plate_number),
    INDEX idx_resident (resident_id),
    INDEX idx_registered (is_registered)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول السيارات';

-- ============================================
-- 6. جدول ملصقات السيارات (Vehicle Stickers)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_stickers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL COMMENT 'معرف السيارة',
    resident_id INT NOT NULL COMMENT 'معرف الساكن',
    sticker_status ENUM('فعال', 'ملغي', 'منتهي') DEFAULT 'فعال' COMMENT 'حالة الملصق',
    issue_date DATE NOT NULL COMMENT 'تاريخ الإصدار',
    expiry_date DATE COMMENT 'تاريخ الانتهاء',
    qr_code VARCHAR(200) COMMENT 'رمز QR',
    license_number VARCHAR(50) COMMENT 'رقم الترخيص',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_resident (resident_id),
    INDEX idx_status (sticker_status),
    INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول ملصقات السيارات';

-- ============================================
-- 7. جدول المخالفات المرورية (Traffic Violations)
-- ============================================
CREATE TABLE IF NOT EXISTS traffic_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'رقم المخالفة',
    vehicle_id INT COMMENT 'معرف السيارة',
    plate_number VARCHAR(20) NOT NULL COMMENT 'رقم اللوحة',
    resident_id INT COMMENT 'معرف الساكن',
    violation_type VARCHAR(100) NOT NULL COMMENT 'نوع المخالفة',
    violation_date DATE NOT NULL COMMENT 'تاريخ المخالفة',
    violation_time TIME NOT NULL COMMENT 'وقت المخالفة',
    location VARCHAR(200) NOT NULL COMMENT 'موقع المخالفة',
    building_id INT COMMENT 'معرف المبنى',
    violation_status ENUM('جديد', 'قيد المراجعة', 'مؤكد', 'ملغي', 'مدفوع') DEFAULT 'جديد' COMMENT 'حالة المخالفة',
    fine_amount DECIMAL(10,2) COMMENT 'قيمة الغرامة',
    is_paid BOOLEAN DEFAULT FALSE COMMENT 'هل تم الدفع',
    payment_date DATE COMMENT 'تاريخ الدفع',
    officer_name VARCHAR(100) COMMENT 'اسم المسجل',
    evidence_image VARCHAR(500) COMMENT 'صورة الإثبات',
    source ENUM('يدوي', 'كاميرا', 'plate_recognizer', 'بلاغ') DEFAULT 'يدوي' COMMENT 'مصدر المخالفة',
    confidence_score DECIMAL(5,2) COMMENT 'نسبة الدقة (للمخالفات الآلية)',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
    INDEX idx_violation_number (violation_number),
    INDEX idx_plate (plate_number),
    INDEX idx_date (violation_date),
    INDEX idx_status (violation_status),
    INDEX idx_type (violation_type),
    INDEX idx_building (building_id),
    INDEX idx_paid (is_paid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المخالفات المرورية';

-- ============================================
-- 8. جدول صور السيارات المحللة (Analyzed Vehicle Images)
-- ============================================
CREATE TABLE IF NOT EXISTS analyzed_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL COMMENT 'مسار الصورة',
    image_name VARCHAR(200) NOT NULL COMMENT 'اسم الصورة',
    plate_number VARCHAR(20) COMMENT 'رقم اللوحة المستخرج',
    vehicle_type VARCHAR(50) COMMENT 'نوع المركبة',
    vehicle_color VARCHAR(30) COMMENT 'لون المركبة',
    confidence_score DECIMAL(5,2) COMMENT 'نسبة الدقة',
    analysis_date DATETIME NOT NULL COMMENT 'تاريخ التحليل',
    api_response JSON COMMENT 'استجابة API الكاملة',
    is_matched BOOLEAN DEFAULT FALSE COMMENT 'هل تطابقت مع قاعدة البيانات',
    matched_vehicle_id INT COMMENT 'معرف السيارة المطابقة',
    repeat_count INT DEFAULT 1 COMMENT 'عدد التكرار',
    image_category ENUM('مخالفة', 'ترخيص', 'موقف_خاص', 'موقف_معاقين', 'عام') COMMENT 'تصنيف الصورة',
    notes TEXT COMMENT 'ملاحظات',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (matched_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_plate (plate_number),
    INDEX idx_analysis_date (analysis_date),
    INDEX idx_matched (is_matched),
    INDEX idx_category (image_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول صور السيارات المحللة';

-- ============================================
-- 9. جدول المستخدمين (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'اسم المستخدم',
    password_hash VARCHAR(255) NOT NULL COMMENT 'كلمة المرور المشفرة',
    full_name VARCHAR(200) NOT NULL COMMENT 'الاسم الكامل',
    email VARCHAR(100) UNIQUE COMMENT 'البريد الإلكتروني',
    phone VARCHAR(20) COMMENT 'رقم الهاتف',
    role ENUM('admin', 'violations_officer', 'inquiry_user', 'manager') NOT NULL COMMENT 'الدور',
    permissions JSON COMMENT 'الصلاحيات',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط',
    last_login DATETIME COMMENT 'آخر تسجيل دخول',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المستخدمين';

-- ============================================
-- 10. جدول سجل النشاطات (Activity Log)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT 'معرف المستخدم',
    action_type VARCHAR(50) NOT NULL COMMENT 'نوع العملية',
    table_name VARCHAR(50) COMMENT 'اسم الجدول',
    record_id INT COMMENT 'معرف السجل',
    action_description TEXT COMMENT 'وصف العملية',
    ip_address VARCHAR(45) COMMENT 'عنوان IP',
    user_agent VARCHAR(500) COMMENT 'معلومات المتصفح',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action_type),
    INDEX idx_table (table_name),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول سجل النشاطات';

-- ============================================
-- 11. جدول الإشعارات (Notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT 'معرف المستخدم المستهدف',
    notification_type VARCHAR(50) NOT NULL COMMENT 'نوع الإشعار',
    title VARCHAR(200) NOT NULL COMMENT 'عنوان الإشعار',
    message TEXT NOT NULL COMMENT 'محتوى الإشعار',
    related_table VARCHAR(50) COMMENT 'الجدول المرتبط',
    related_id INT COMMENT 'معرف السجل المرتبط',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'هل تم القراءة',
    read_at DATETIME COMMENT 'تاريخ القراءة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (notification_type),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الإشعارات';

-- ============================================
-- 12. جدول التقارير المحفوظة (Saved Reports)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL COMMENT 'اسم التقرير',
    report_type VARCHAR(50) NOT NULL COMMENT 'نوع التقرير',
    report_data JSON NOT NULL COMMENT 'بيانات التقرير',
    filters JSON COMMENT 'الفلاتر المطبقة',
    created_by INT COMMENT 'منشئ التقرير',
    file_path VARCHAR(500) COMMENT 'مسار الملف المحفوظ',
    file_format ENUM('excel', 'pdf', 'html', 'csv') COMMENT 'صيغة الملف',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (report_type),
    INDEX idx_creator (created_by),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول التقارير المحفوظة';

-- ============================================
-- 13. جدول إعدادات النظام (System Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'مفتاح الإعداد',
    setting_value TEXT COMMENT 'قيمة الإعداد',
    setting_type VARCHAR(50) COMMENT 'نوع الإعداد',
    description TEXT COMMENT 'وصف الإعداد',
    is_editable BOOLEAN DEFAULT TRUE COMMENT 'قابل للتعديل',
    updated_by INT COMMENT 'آخر من عدّل',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول إعدادات النظام';

-- ============================================
-- Views (العروض)
-- ============================================

-- عرض: ملخص المباني
CREATE OR REPLACE VIEW v_buildings_summary AS
SELECT 
    b.id,
    b.building_number,
    b.building_name,
    b.building_type,
    b.building_category,
    b.total_units,
    b.occupied_units,
    b.vacant_units,
    b.total_parking,
    COUNT(DISTINCT r.id) as residents_count,
    COUNT(DISTINCT v.id) as vehicles_count,
    COUNT(DISTINCT tv.id) as violations_count
FROM buildings b
LEFT JOIN residential_units ru ON b.id = ru.building_id
LEFT JOIN residents r ON ru.id = r.unit_id AND r.is_active = TRUE
LEFT JOIN vehicles v ON r.id = v.resident_id
LEFT JOIN traffic_violations tv ON b.id = tv.building_id
GROUP BY b.id;

-- عرض: السيارات مع معلومات السكان
CREATE OR REPLACE VIEW v_vehicles_with_residents AS
SELECT 
    v.id,
    v.plate_number,
    v.plate_number_ar,
    v.vehicle_make,
    v.vehicle_model,
    v.vehicle_year,
    v.vehicle_color,
    v.vehicle_type,
    r.id as resident_id,
    r.national_id,
    r.full_name as resident_name,
    r.phone,
    ru.unit_name,
    b.building_name,
    ps.parking_number,
    vs.sticker_status,
    COUNT(DISTINCT tv.id) as violations_count
FROM vehicles v
LEFT JOIN residents r ON v.resident_id = r.id
LEFT JOIN residential_units ru ON r.unit_id = ru.id
LEFT JOIN buildings b ON ru.building_id = b.id
LEFT JOIN parking_spaces ps ON v.parking_id = ps.id
LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id AND vs.sticker_status = 'فعال'
LEFT JOIN traffic_violations tv ON v.id = tv.vehicle_id
GROUP BY v.id;

-- عرض: المخالفات مع التفاصيل الكاملة
CREATE OR REPLACE VIEW v_violations_detailed AS
SELECT 
    tv.id,
    tv.violation_number,
    tv.plate_number,
    tv.violation_type,
    tv.violation_date,
    tv.violation_time,
    tv.location,
    tv.violation_status,
    tv.fine_amount,
    tv.is_paid,
    tv.source,
    tv.confidence_score,
    r.full_name as resident_name,
    r.national_id,
    r.phone,
    ru.unit_name,
    b.building_name,
    b.building_category,
    v.vehicle_make,
    v.vehicle_model,
    v.vehicle_color
FROM traffic_violations tv
LEFT JOIN vehicles v ON tv.vehicle_id = v.id
LEFT JOIN residents r ON tv.resident_id = r.id
LEFT JOIN residential_units ru ON r.unit_id = ru.id
LEFT JOIN buildings b ON tv.building_id = b.id;

-- عرض: إحصائيات المواقف
CREATE OR REPLACE VIEW v_parking_statistics AS
SELECT 
    parking_type,
    parking_zone,
    COUNT(*) as total_spaces,
    SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied_spaces,
    SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as vacant_spaces,
    ROUND((SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as occupancy_rate
FROM parking_spaces
GROUP BY parking_type, parking_zone;

-- ============================================
-- Stored Procedures (الإجراءات المخزنة)
-- ============================================

-- إجراء: تحديث إحصائيات المبنى
DELIMITER //
CREATE PROCEDURE sp_update_building_statistics(IN p_building_id INT)
BEGIN
    UPDATE buildings b
    SET 
        total_units = (SELECT COUNT(*) FROM residential_units WHERE building_id = p_building_id),
        occupied_units = (SELECT COUNT(*) FROM residential_units WHERE building_id = p_building_id AND is_occupied = TRUE),
        vacant_units = (SELECT COUNT(*) FROM residential_units WHERE building_id = p_building_id AND is_occupied = FALSE),
        total_parking = (SELECT COUNT(*) FROM parking_spaces WHERE building_id = p_building_id)
    WHERE id = p_building_id;
END //
DELIMITER ;

-- إجراء: البحث عن السيارات المتكررة في المخالفات
DELIMITER //
CREATE PROCEDURE sp_get_repeat_violators(IN p_min_violations INT)
BEGIN
    SELECT 
        v.plate_number,
        v.vehicle_make,
        v.vehicle_model,
        r.full_name as resident_name,
        ru.unit_name,
        b.building_name,
        COUNT(tv.id) as violations_count,
        SUM(tv.fine_amount) as total_fines,
        MAX(tv.violation_date) as last_violation_date
    FROM vehicles v
    INNER JOIN traffic_violations tv ON v.id = tv.vehicle_id
    LEFT JOIN residents r ON v.resident_id = r.id
    LEFT JOIN residential_units ru ON r.unit_id = ru.id
    LEFT JOIN buildings b ON ru.building_id = b.id
    GROUP BY v.id
    HAVING violations_count >= p_min_violations
    ORDER BY violations_count DESC, total_fines DESC;
END //
DELIMITER ;

-- إجراء: إحصائيات المخالفات حسب النوع
DELIMITER //
CREATE PROCEDURE sp_violations_by_type(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
    SELECT 
        violation_type,
        COUNT(*) as violations_count,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM traffic_violations WHERE violation_date BETWEEN p_start_date AND p_end_date)) * 100, 2) as percentage,
        SUM(fine_amount) as total_fines,
        SUM(CASE WHEN is_paid = TRUE THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN is_paid = FALSE THEN 1 ELSE 0 END) as unpaid_count
    FROM traffic_violations
    WHERE violation_date BETWEEN p_start_date AND p_end_date
    GROUP BY violation_type
    ORDER BY violations_count DESC;
END //
DELIMITER ;

-- ============================================
-- Triggers (المشغلات)
-- ============================================

-- مشغل: تحديث حالة الوحدة عند إضافة ساكن
DELIMITER //
CREATE TRIGGER tr_update_unit_on_resident_insert
AFTER INSERT ON residents
FOR EACH ROW
BEGIN
    IF NEW.unit_id IS NOT NULL THEN
        UPDATE residential_units 
        SET is_occupied = TRUE, occupancy_status = 'مشغول'
        WHERE id = NEW.unit_id;
        
        -- تحديث إحصائيات المبنى
        CALL sp_update_building_statistics(
            (SELECT building_id FROM residential_units WHERE id = NEW.unit_id)
        );
    END IF;
END //
DELIMITER ;

-- مشغل: تحديث حالة الوحدة عند حذف ساكن
DELIMITER //
CREATE TRIGGER tr_update_unit_on_resident_delete
AFTER DELETE ON residents
FOR EACH ROW
BEGIN
    IF OLD.unit_id IS NOT NULL THEN
        -- التحقق من عدم وجود سكان آخرين في نفس الوحدة
        IF (SELECT COUNT(*) FROM residents WHERE unit_id = OLD.unit_id AND is_active = TRUE) = 0 THEN
            UPDATE residential_units 
            SET is_occupied = FALSE, occupancy_status = 'شاغر'
            WHERE id = OLD.unit_id;
        END IF;
        
        -- تحديث إحصائيات المبنى
        CALL sp_update_building_statistics(
            (SELECT building_id FROM residential_units WHERE id = OLD.unit_id)
        );
    END IF;
END //
DELIMITER ;

-- مشغل: تسجيل النشاط عند إضافة مخالفة
DELIMITER //
CREATE TRIGGER tr_log_violation_insert
AFTER INSERT ON traffic_violations
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (action_type, table_name, record_id, action_description)
    VALUES ('INSERT', 'traffic_violations', NEW.id, 
            CONCAT('تم إضافة مخالفة جديدة رقم: ', NEW.violation_number, ' للوحة: ', NEW.plate_number));
END //
DELIMITER ;

-- ============================================
-- Indexes (الفهارس الإضافية)
-- ============================================

-- فهرس مركب للبحث السريع
CREATE INDEX idx_violations_search ON traffic_violations(plate_number, violation_date, violation_status);
CREATE INDEX idx_vehicles_search ON vehicles(plate_number, resident_id, is_registered);
CREATE INDEX idx_residents_search ON residents(national_id, full_name, unit_id);

-- ============================================
-- إدراج البيانات الافتراضية
-- ============================================

-- إضافة المستخدمين الافتراضيين
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مدير النظام', 'admin', TRUE),
('violations_officer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مسجل المخالفات', 'violations_officer', TRUE),
('inquiry_user', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'موظف الاستعلام', 'inquiry_user', TRUE);

-- إضافة إعدادات النظام الافتراضية
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('system_name', 'نظام إدارة المرور - وحدة إسكان هيئة التدريس', 'string', 'اسم النظام'),
('plate_recognizer_api_token', '22ba3cf7155a1ea730a0b64787f98ab5f9a3de94', 'string', 'مفتاح API لـ Plate Recognizer'),
('parkpow_token', '7c13be422713a758a42a0bc453cf3331fbfd346', 'string', 'مفتاح ParkPow'),
('default_fine_amount', '500.00', 'decimal', 'قيمة الغرامة الافتراضية'),
('max_violations_before_warning', '3', 'integer', 'عدد المخالفات قبل التحذير'),
('email_notifications_enabled', 'true', 'boolean', 'تفعيل إشعارات البريد الإلكتروني');

-- ============================================
-- ملاحظات مهمة
-- ============================================

/*
1. جميع الجداول تستخدم InnoDB لدعم المعاملات والعلاقات
2. الترميز utf8mb4 لدعم اللغة العربية بشكل كامل
3. الفهارس مضافة للحقول الأكثر استخداماً في البحث
4. العلاقات محددة بـ FOREIGN KEY مع CASCADE/SET NULL حسب الحاجة
5. التواريخ والأوقات تستخدم TIMESTAMP لتسجيل التعديلات تلقائياً
6. JSON يستخدم للبيانات المرنة (الصلاحيات، استجابة API، إلخ)
7. ENUM يستخدم للقيم المحددة مسبقاً
8. Views تسهل الاستعلامات المعقدة
9. Stored Procedures للعمليات المتكررة
10. Triggers للتحديثات التلقائية

كلمة المرور الافتراضية لجميع المستخدمين: password
يجب تغييرها فوراً في بيئة الإنتاج!
*/
