-- تحديث جدول الوحدات السكنية
-- إضافة الحقول الجديدة المطلوبة

USE traffic_management_system;

-- 1. إضافة عمود وصف المبنى (إذا لم يكن موجوداً)
ALTER TABLE residential_units 
ADD COLUMN IF NOT EXISTS building_description VARCHAR(500) COMMENT 'وصف المبنى' AFTER unit_type;

-- 2. التأكد من وجود عمود building_category في جدول buildings
-- (هذا العمود موجود بالفعل في schema.sql)

-- 3. إنشاء عرض (View) محسّن للوحدات السكنية مع جميع البيانات المطلوبة
CREATE OR REPLACE VIEW v_residential_units_detailed AS
SELECT 
    ru.id,
    ru.unit_name AS unit_name,
    b.building_category AS building_category,
    r.phone AS resident_phone,
    ps.parking_number AS parking_number,
    COALESCE(ru.building_description, b.location, '-') AS building_description,
    ru.occupancy_status AS occupancy_status,
    b.building_number AS building_number,
    ru.unit_number AS unit_number,
    ru.unit_type AS unit_type,
    r.full_name AS resident_name,
    r.national_id AS resident_national_id,
    b.building_name AS building_name,
    b.building_type AS building_type,
    ru.floor_number,
    ru.area_sqm,
    ru.rooms_count,
    ru.is_occupied,
    r.id AS resident_id,
    b.id AS building_id,
    ps.id AS parking_id
FROM residential_units ru
LEFT JOIN buildings b ON ru.building_id = b.id
LEFT JOIN residents r ON ru.id = r.unit_id AND r.is_active = TRUE
LEFT JOIN parking_spaces ps ON ru.id = ps.unit_id AND ps.parking_type = 'خاص'
ORDER BY b.building_number, ru.unit_number;

-- 4. إنشاء عرض للإحصائيات
CREATE OR REPLACE VIEW v_units_statistics AS
SELECT 
    COUNT(*) AS total_units,
    SUM(CASE WHEN ru.unit_type = 'فلة' THEN 1 ELSE 0 END) AS villas_count,
    SUM(CASE WHEN ru.is_occupied = FALSE THEN 1 ELSE 0 END) AS vacant_units,
    SUM(CASE WHEN ru.is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied_units,
    SUM(CASE WHEN b.building_category = 'جديد' THEN 1 ELSE 0 END) AS new_buildings_units
FROM residential_units ru
LEFT JOIN buildings b ON ru.building_id = b.id;

-- 5. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_unit_name ON residential_units(unit_name);
CREATE INDEX IF NOT EXISTS idx_building_description ON residential_units(building_description);

-- 6. تحديث البيانات الموجودة (إضافة وصف المبنى من جدول المباني)
UPDATE residential_units ru
INNER JOIN buildings b ON ru.building_id = b.id
SET ru.building_description = CONCAT(b.building_name, ' - ', COALESCE(b.location, 'الموقع غير محدد'))
WHERE ru.building_description IS NULL OR ru.building_description = '';

-- 7. التحقق من النتائج
SELECT 'تم تحديث جدول الوحدات السكنية بنجاح' AS status;

-- عرض عينة من البيانات
SELECT * FROM v_residential_units_detailed LIMIT 10;

-- عرض الإحصائيات
SELECT * FROM v_units_statistics;
