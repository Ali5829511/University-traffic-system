-- ============================================
-- مخطط قاعدة البيانات - نظام إدارة المرور
-- PostgreSQL Version
-- وحدة إسكان هيئة التدريس
-- جامعة الإمام محمد بن سعود الإسلامية
-- ============================================

-- ============================================
-- 1. جدول المباني (Buildings)
-- ============================================
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    building_number VARCHAR(10) NOT NULL UNIQUE,
    building_name VARCHAR(100) NOT NULL,
    building_type VARCHAR(20) NOT NULL CHECK (building_type IN ('عمارة', 'فلة')),
    building_category VARCHAR(20) NOT NULL CHECK (building_category IN ('قديم', 'جديد', 'فلل')),
    total_units INTEGER NOT NULL DEFAULT 0,
    occupied_units INTEGER NOT NULL DEFAULT 0,
    vacant_units INTEGER NOT NULL DEFAULT 0,
    total_parking INTEGER NOT NULL DEFAULT 0,
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(building_type);
CREATE INDEX IF NOT EXISTS idx_buildings_category ON buildings(building_category);

-- ============================================
-- 2. جدول الوحدات السكنية (Residential Units)
-- ============================================
CREATE TABLE IF NOT EXISTS residential_units (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unit_number VARCHAR(10) NOT NULL,
    unit_name VARCHAR(100) NOT NULL UNIQUE,
    unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('شقة', 'فلة')),
    floor_number INTEGER,
    is_occupied BOOLEAN DEFAULT FALSE,
    occupancy_status VARCHAR(20) DEFAULT 'شاغر' CHECK (occupancy_status IN ('شاغر', 'مشغول')),
    area_sqm DECIMAL(10,2),
    rooms_count INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_residential_units_building ON residential_units(building_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_residential_units_occupancy ON residential_units(is_occupied);
CREATE INDEX IF NOT EXISTS idx_residential_units_type ON residential_units(unit_type);

-- ============================================
-- 3. جدول السكان (Residents)
-- ============================================
CREATE TABLE IF NOT EXISTS residents (
    id SERIAL PRIMARY KEY,
    national_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    unit_id INTEGER REFERENCES residential_units(id) ON DELETE SET NULL,
    job_title VARCHAR(100),
    department VARCHAR(100),
    family_members INTEGER DEFAULT 1,
    move_in_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_residents_national_id ON residents(national_id);
CREATE INDEX IF NOT EXISTS idx_residents_unit ON residents(unit_id);
CREATE INDEX IF NOT EXISTS idx_residents_active ON residents(is_active);
CREATE INDEX IF NOT EXISTS idx_residents_name ON residents(full_name);

-- ============================================
-- 4. جدول المواقف (Parking Spaces)
-- ============================================
CREATE TABLE IF NOT EXISTS parking_spaces (
    id SERIAL PRIMARY KEY,
    parking_number VARCHAR(20) NOT NULL UNIQUE,
    parking_type VARCHAR(20) NOT NULL CHECK (parking_type IN ('خاص', 'عام', 'معاقين')),
    parking_zone VARCHAR(50),
    building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
    unit_id INTEGER REFERENCES residential_units(id) ON DELETE SET NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    location_description VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parking_type ON parking_spaces(parking_type);
CREATE INDEX IF NOT EXISTS idx_parking_building ON parking_spaces(building_id);
CREATE INDEX IF NOT EXISTS idx_parking_occupied ON parking_spaces(is_occupied);

-- ============================================
-- 5. جدول السيارات (Vehicles)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL,
    plate_number_ar VARCHAR(20),
    resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL,
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INTEGER,
    vehicle_color VARCHAR(30),
    vehicle_type VARCHAR(30),
    parking_id INTEGER REFERENCES parking_spaces(id) ON DELETE SET NULL,
    is_registered BOOLEAN DEFAULT FALSE,
    registration_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_resident ON vehicles(resident_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registered ON vehicles(is_registered);

-- ============================================
-- 6. جدول ملصقات السيارات (Vehicle Stickers)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_stickers (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    sticker_status VARCHAR(20) DEFAULT 'فعال' CHECK (sticker_status IN ('فعال', 'ملغي', 'منتهي')),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    qr_code VARCHAR(200),
    license_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stickers_vehicle ON vehicle_stickers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_stickers_resident ON vehicle_stickers(resident_id);
CREATE INDEX IF NOT EXISTS idx_stickers_status ON vehicle_stickers(sticker_status);

-- ============================================
-- 7. جدول المخالفات المرورية (Traffic Violations)
-- ============================================
CREATE TABLE IF NOT EXISTS traffic_violations (
    id SERIAL PRIMARY KEY,
    violation_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    plate_number VARCHAR(20) NOT NULL,
    resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL,
    violation_type VARCHAR(100) NOT NULL,
    violation_date DATE NOT NULL,
    violation_time TIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
    violation_status VARCHAR(30) DEFAULT 'جديد' CHECK (violation_status IN ('جديد', 'قيد المراجعة', 'مؤكد', 'ملغي', 'مدفوع')),
    fine_amount DECIMAL(10,2),
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    officer_name VARCHAR(100),
    evidence_image VARCHAR(500),
    source VARCHAR(30) DEFAULT 'يدوي' CHECK (source IN ('يدوي', 'كاميرا', 'plate_recognizer', 'بلاغ')),
    confidence_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_violations_number ON traffic_violations(violation_number);
CREATE INDEX IF NOT EXISTS idx_violations_plate ON traffic_violations(plate_number);
CREATE INDEX IF NOT EXISTS idx_violations_date ON traffic_violations(violation_date);
CREATE INDEX IF NOT EXISTS idx_violations_status ON traffic_violations(violation_status);

-- ============================================
-- 8. جدول المستخدمين (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'violations_officer', 'inquiry_user', 'manager')),
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================
-- 10. جدول سجلات الأنشطة (Audit Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 11. جدول صور المخالفات (Violation Images)
-- ============================================
CREATE TABLE IF NOT EXISTS violation_images (
    id SERIAL PRIMARY KEY,
    violation_id INTEGER REFERENCES traffic_violations(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    image_type VARCHAR(20) DEFAULT 'violation',
    file_size INTEGER,
    mime_type VARCHAR(50),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_violation_images_violation ON violation_images(violation_id);
CREATE INDEX IF NOT EXISTS idx_violation_images_uploaded ON violation_images(uploaded_by);

-- ============================================
-- 12. جدول إحصائيات المخالفات (Violation Statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS violation_stats (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    total_count INTEGER DEFAULT 0,
    total_actions INTEGER DEFAULT 0,
    total_fines DECIMAL(12,2) DEFAULT 0,
    avg_fine DECIMAL(12,2),
    last_violation TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (vehicle_id, violation_type)
);

CREATE INDEX IF NOT EXISTS idx_violation_stats_vehicle ON violation_stats(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_violation_stats_type ON violation_stats(violation_type);
CREATE INDEX IF NOT EXISTS idx_violation_stats_count ON violation_stats(total_count DESC);

-- ============================================
-- إدراج بيانات المستخدمين الافتراضية
-- ============================================
-- ملاحظة: كلمات المرور يجب تشفيرها في التطبيق الفعلي
-- هذه البيانات للتطوير فقط

INSERT INTO users (username, password_hash, full_name, email, role, is_active) 
VALUES 
    ('admin', '$2a$10$placeholder', 'مدير النظام', 'admin@university.edu.sa', 'admin', true),
    ('violations_officer', '$2a$10$placeholder', 'مسجل المخالفات', 'violations@university.edu.sa', 'violations_officer', true),
    ('inquiry_user', '$2a$10$placeholder', 'موظف الاستعلام', 'inquiry@university.edu.sa', 'inquiry_user', true)
ON CONFLICT (username) DO NOTHING;
