# 📊 توثيق قاعدة البيانات - نظام إدارة المرور

**وحدة إسكان هيئة التدريس**  
**جامعة الإمام محمد بن سعود الإسلامية**

---

## 📑 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [هيكل قاعدة البيانات](#هيكل-قاعدة-البيانات)
3. [الجداول الرئيسية](#الجداول-الرئيسية)
4. [العلاقات بين الجداول](#العلاقات-بين-الجداول)
5. [العروض (Views)](#العروض-views)
6. [الإجراءات المخزنة](#الإجراءات-المخزنة)
7. [المشغلات (Triggers)](#المشغلات-triggers)
8. [الفهارس](#الفهارس)
9. [أمثلة الاستعلامات](#أمثلة-الاستعلامات)
10. [التكامل مع Plate Recognizer](#التكامل-مع-plate-recognizer)

---

## 🎯 نظرة عامة

تم تصميم قاعدة البيانات لدعم نظام إدارة المرور المتكامل الذي يهدف إلى:

### الأهداف الرئيسية

1. **إنشاء قاعدة بيانات شاملة للسيارات** داخل إسكان هيئة التدريس
2. **تسجيل المخالفات المرورية** وتتبعها بدقة
3. **تحديد السيارات المتكررة** في المخالفات
4. **التكامل مع Plate Recognizer API** لتحليل صور السيارات تلقائياً
5. **إدارة الملصقات والمواقف** بكفاءة عالية

### المواصفات التقنية

| المواصفة | القيمة |
|---------|--------|
| **نظام إدارة قواعد البيانات** | MySQL 8.0+ / MariaDB 10.5+ |
| **محرك التخزين** | InnoDB |
| **الترميز** | utf8mb4 |
| **Collation** | utf8mb4_unicode_ci |
| **عدد الجداول** | 13 جدول رئيسي |
| **عدد العروض** | 4 عروض |
| **عدد الإجراءات المخزنة** | 3 إجراءات |
| **عدد المشغلات** | 3 مشغلات |

---

## 🏗️ هيكل قاعدة البيانات

### مخطط العلاقات (ERD)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  buildings  │◄───────┤residential_units │◄───────┤  residents  │
└─────────────┘         └──────────────────┘         └─────────────┘
      ▲                         ▲                           ▲
      │                         │                           │
      │                         │                           │
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   parking   │         │    vehicles      │         │  stickers   │
│   _spaces   │◄────────┤                  │◄────────┤             │
└─────────────┘         └──────────────────┘         └─────────────┘
                                 ▲
                                 │
                                 │
                        ┌────────────────┐
                        │   violations   │
                        └────────────────┘
                                 ▲
                                 │
                        ┌────────────────┐
                        │analyzed_images │
                        └────────────────┘
```

### تصنيف الجداول

#### 1. جداول البيانات الأساسية
- `buildings` - المباني
- `residential_units` - الوحدات السكنية
- `residents` - السكان
- `parking_spaces` - المواقف

#### 2. جداول إدارة السيارات
- `vehicles` - السيارات
- `vehicle_stickers` - ملصقات السيارات
- `traffic_violations` - المخالفات المرورية
- `analyzed_images` - صور السيارات المحللة

#### 3. جداول النظام والإدارة
- `users` - المستخدمين
- `activity_log` - سجل النشاطات
- `notifications` - الإشعارات
- `saved_reports` - التقارير المحفوظة
- `system_settings` - إعدادات النظام

---

## 📋 الجداول الرئيسية

### 1. جدول المباني (buildings)

يحتوي على معلومات جميع المباني في الإسكان.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key, Auto Increment |
| `building_number` | VARCHAR(10) | رقم المبنى | UNIQUE, NOT NULL |
| `building_name` | VARCHAR(100) | اسم المبنى | NOT NULL |
| `building_type` | ENUM | نوع المبنى | 'عمارة', 'فلة' |
| `building_category` | ENUM | فئة المبنى | 'قديم', 'جديد', 'فلل' |
| `total_units` | INT | إجمالي الوحدات | DEFAULT 0 |
| `occupied_units` | INT | الوحدات المشغولة | DEFAULT 0 |
| `vacant_units` | INT | الوحدات الشاغرة | DEFAULT 0 |
| `total_parking` | INT | إجمالي المواقف | DEFAULT 0 |
| `location` | VARCHAR(200) | الموقع | - |
| `notes` | TEXT | ملاحظات | - |

**الفهارس:**
- `idx_building_type` على `building_type`
- `idx_building_category` على `building_category`

---

### 2. جدول الوحدات السكنية (residential_units)

يحتوي على معلومات جميع الشقق والفلل.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `building_id` | INT | معرف المبنى | Foreign Key → buildings(id) |
| `unit_number` | VARCHAR(10) | رقم الوحدة | NOT NULL |
| `unit_name` | VARCHAR(100) | اسم الوحدة الكامل | UNIQUE |
| `unit_type` | ENUM | نوع الوحدة | 'شقة', 'فلة' |
| `floor_number` | INT | رقم الطابق | - |
| `is_occupied` | BOOLEAN | هل مشغولة | DEFAULT FALSE |
| `occupancy_status` | ENUM | حالة الإشغال | 'شاغر', 'مشغول' |
| `area_sqm` | DECIMAL(10,2) | المساحة بالمتر المربع | - |
| `rooms_count` | INT | عدد الغرف | - |

**العلاقات:**
- `building_id` → `buildings.id` (CASCADE DELETE)

**الفهارس:**
- `idx_building_unit` على `(building_id, unit_number)`
- `idx_occupancy` على `is_occupied`
- `idx_unit_type` على `unit_type`

---

### 3. جدول السكان (residents)

يحتوي على معلومات جميع السكان في الإسكان.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `national_id` | VARCHAR(20) | رقم الهوية الوطنية | UNIQUE, NOT NULL |
| `full_name` | VARCHAR(200) | الاسم الكامل | NOT NULL |
| `phone` | VARCHAR(20) | رقم الهاتف | - |
| `email` | VARCHAR(100) | البريد الإلكتروني | - |
| `unit_id` | INT | معرف الوحدة السكنية | Foreign Key → residential_units(id) |
| `job_title` | VARCHAR(100) | المسمى الوظيفي | - |
| `department` | VARCHAR(100) | القسم | - |
| `family_members` | INT | عدد أفراد الأسرة | DEFAULT 1 |
| `move_in_date` | DATE | تاريخ السكن | - |
| `is_active` | BOOLEAN | نشط | DEFAULT TRUE |

**العلاقات:**
- `unit_id` → `residential_units.id` (SET NULL)

**الفهارس:**
- `idx_national_id` على `national_id`
- `idx_unit_id` على `unit_id`
- `idx_active` على `is_active`
- `idx_name` على `full_name`

---

### 4. جدول المواقف (parking_spaces)

يحتوي على معلومات جميع المواقف (خاصة، عامة، معاقين).

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `parking_number` | VARCHAR(20) | رقم الموقف | UNIQUE, NOT NULL |
| `parking_type` | ENUM | نوع الموقف | 'خاص', 'عام', 'معاقين' |
| `parking_zone` | VARCHAR(50) | منطقة الموقف | - |
| `building_id` | INT | معرف المبنى | Foreign Key (للمواقف الخاصة) |
| `unit_id` | INT | معرف الوحدة | Foreign Key (للمواقف الخاصة) |
| `is_occupied` | BOOLEAN | هل مشغول | DEFAULT FALSE |
| `location_description` | VARCHAR(200) | وصف الموقع | - |

**ملاحظات مهمة:**
- **المواقف الخاصة:** كل شقة لها موقف واحد مخصص (1020 موقف)
- **المواقف العامة:** 241 موقف في المباني القديمة والجديدة
- **مواقف المعاقين:** 18 موقف في عمارة 18، و21 موقف في عمارة 79
- **الفلل:** لا يتم تخصيص مواقف لها في النظام (لديها مواقفها الخاصة)

**الفهارس:**
- `idx_parking_type` على `parking_type`
- `idx_building` على `building_id`
- `idx_occupied` على `is_occupied`
- `idx_zone` على `parking_zone`

---

### 5. جدول السيارات (vehicles)

يحتوي على معلومات جميع السيارات المسجلة.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `plate_number` | VARCHAR(20) | رقم اللوحة (إنجليزي) | NOT NULL, مفهرس |
| `plate_number_ar` | VARCHAR(20) | رقم اللوحة (عربي) | للعرض فقط |
| `resident_id` | INT | معرف الساكن | Foreign Key → residents(id) |
| `vehicle_make` | VARCHAR(50) | صانع السيارة | مثل: Toyota, Honda |
| `vehicle_model` | VARCHAR(50) | موديل السيارة | مثل: Camry, Accord |
| `vehicle_year` | INT | سنة الصنع | - |
| `vehicle_color` | VARCHAR(30) | لون السيارة | - |
| `vehicle_type` | VARCHAR(30) | نوع المركبة | سيدان، SUV، إلخ |
| `parking_id` | INT | معرف الموقف المخصص | Foreign Key → parking_spaces(id) |
| `is_registered` | BOOLEAN | هل مسجلة | DEFAULT FALSE |
| `registration_date` | DATE | تاريخ التسجيل | - |

**ملاحظات مهمة:**
- يجب أن تكون `plate_number` بالإنجليزية دائماً للبحث والمطابقة
- `plate_number_ar` للعرض فقط بتنسيق اللوحات السعودية
- الساكن الواحد يمكن أن يمتلك أكثر من سيارة

**الفهارس:**
- `idx_plate_number` على `plate_number`
- `idx_resident` على `resident_id`
- `idx_registered` على `is_registered`

---

### 6. جدول ملصقات السيارات (vehicle_stickers)

يحتوي على معلومات ملصقات السيارات الصادرة.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `vehicle_id` | INT | معرف السيارة | Foreign Key → vehicles(id) |
| `resident_id` | INT | معرف الساكن | Foreign Key → residents(id) |
| `sticker_status` | ENUM | حالة الملصق | 'فعال', 'ملغي', 'منتهي' |
| `issue_date` | DATE | تاريخ الإصدار | NOT NULL |
| `expiry_date` | DATE | تاريخ الانتهاء | - |
| `qr_code` | VARCHAR(200) | رمز QR | - |
| `license_number` | VARCHAR(50) | رقم الترخيص | - |

**ملاحظات مهمة:**
- الساكن الواحد يمكن أن يكون لديه أكثر من ملصق (لأكثر من سيارة)
- لا يتم عرض رقم الملصق في الجداول (حسب تفضيلات المستخدم)
- حالة الملصق: 1 = فعال، 0 = ملغي

**الفهارس:**
- `idx_vehicle` على `vehicle_id`
- `idx_resident` على `resident_id`
- `idx_status` على `sticker_status`
- `idx_expiry` على `expiry_date`

---

### 7. جدول المخالفات المرورية (traffic_violations)

يحتوي على معلومات جميع المخالفات المسجلة.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `violation_number` | VARCHAR(50) | رقم المخالفة | UNIQUE, NOT NULL |
| `vehicle_id` | INT | معرف السيارة | Foreign Key (إذا كانت مسجلة) |
| `plate_number` | VARCHAR(20) | رقم اللوحة | NOT NULL |
| `resident_id` | INT | معرف الساكن | Foreign Key (إذا كان معروفاً) |
| `violation_type` | VARCHAR(100) | نوع المخالفة | NOT NULL |
| `violation_date` | DATE | تاريخ المخالفة | NOT NULL |
| `violation_time` | TIME | وقت المخالفة | NOT NULL |
| `location` | VARCHAR(200) | موقع المخالفة | NOT NULL |
| `building_id` | INT | معرف المبنى | Foreign Key |
| `violation_status` | ENUM | حالة المخالفة | 'جديد', 'قيد المراجعة', 'مؤكد', 'ملغي', 'مدفوع' |
| `fine_amount` | DECIMAL(10,2) | قيمة الغرامة | - |
| `is_paid` | BOOLEAN | هل تم الدفع | DEFAULT FALSE |
| `payment_date` | DATE | تاريخ الدفع | - |
| `officer_name` | VARCHAR(100) | اسم المسجل | - |
| `evidence_image` | VARCHAR(500) | صورة الإثبات | مسار الصورة |
| `source` | ENUM | مصدر المخالفة | 'يدوي', 'كاميرا', 'plate_recognizer', 'بلاغ' |
| `confidence_score` | DECIMAL(5,2) | نسبة الدقة | للمخالفات الآلية |

**أنواع المخالفات الشائعة:**
- وقوف في موقف معاقين (500 ريال)
- وقوف في موقف خاص لغيره (150 ريال)
- وقوف مزدوج (200 ريال)
- وقوف في ممر طوارئ (300 ريال)
- وقوف بدون ملصق (100 ريال)

**الفهارس:**
- `idx_violation_number` على `violation_number`
- `idx_plate` على `plate_number`
- `idx_date` على `violation_date`
- `idx_status` على `violation_status`
- `idx_type` على `violation_type`
- `idx_building` على `building_id`
- `idx_paid` على `is_paid`
- `idx_violations_search` مركب على `(plate_number, violation_date, violation_status)`

---

### 8. جدول صور السيارات المحللة (analyzed_images)

يحتوي على معلومات الصور المحللة عبر Plate Recognizer API.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `image_path` | VARCHAR(500) | مسار الصورة | NOT NULL |
| `image_name` | VARCHAR(200) | اسم الصورة | NOT NULL |
| `plate_number` | VARCHAR(20) | رقم اللوحة المستخرج | - |
| `vehicle_type` | VARCHAR(50) | نوع المركبة | - |
| `vehicle_color` | VARCHAR(30) | لون المركبة | - |
| `confidence_score` | DECIMAL(5,2) | نسبة الدقة | من API |
| `analysis_date` | DATETIME | تاريخ التحليل | NOT NULL |
| `api_response` | JSON | استجابة API الكاملة | للمراجعة |
| `is_matched` | BOOLEAN | هل تطابقت مع قاعدة البيانات | DEFAULT FALSE |
| `matched_vehicle_id` | INT | معرف السيارة المطابقة | Foreign Key |
| `repeat_count` | INT | عدد التكرار | DEFAULT 1 |
| `image_category` | ENUM | تصنيف الصورة | 'مخالفة', 'ترخيص', 'موقف_خاص', 'موقف_معاقين', 'عام' |

**الفهارس:**
- `idx_plate` على `plate_number`
- `idx_analysis_date` على `analysis_date`
- `idx_matched` على `is_matched`
- `idx_category` على `image_category`

---

### 9. جدول المستخدمين (users)

يحتوي على معلومات مستخدمي النظام.

| الحقل | النوع | الوصف | ملاحظات |
|------|------|-------|---------|
| `id` | INT | المعرف الفريد | Primary Key |
| `username` | VARCHAR(50) | اسم المستخدم | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | كلمة المرور المشفرة | bcrypt |
| `full_name` | VARCHAR(200) | الاسم الكامل | NOT NULL |
| `email` | VARCHAR(100) | البريد الإلكتروني | UNIQUE |
| `phone` | VARCHAR(20) | رقم الهاتف | - |
| `role` | ENUM | الدور | 'admin', 'violations_officer', 'inquiry_user', 'manager' |
| `permissions` | JSON | الصلاحيات | تفصيلية |
| `is_active` | BOOLEAN | نشط | DEFAULT TRUE |
| `last_login` | DATETIME | آخر تسجيل دخول | - |

**الحسابات الافتراضية:**

| اسم المستخدم | كلمة المرور | الدور | الصلاحيات |
|-------------|-------------|------|-----------|
| admin | admin123 | admin | وصول كامل |
| violations_officer | violations123 | violations_officer | إضافة مخالفات فقط |
| inquiry_user | inquiry123 | inquiry_user | استعلام وتقارير |

---

## 🔗 العلاقات بين الجداول

### العلاقات الرئيسية

```sql
-- المباني → الوحدات السكنية (1:N)
buildings.id → residential_units.building_id

-- الوحدات السكنية → السكان (1:N)
residential_units.id → residents.unit_id

-- السكان → السيارات (1:N)
residents.id → vehicles.resident_id

-- السيارات → ملصقات السيارات (1:N)
vehicles.id → vehicle_stickers.vehicle_id

-- السيارات → المخالفات (1:N)
vehicles.id → traffic_violations.vehicle_id

-- المباني → المواقف (1:N)
buildings.id → parking_spaces.building_id

-- الوحدات → المواقف (1:1 للمواقف الخاصة)
residential_units.id → parking_spaces.unit_id

-- السيارات → المواقف (N:1)
parking_spaces.id → vehicles.parking_id

-- السيارات → الصور المحللة (1:N)
vehicles.id → analyzed_images.matched_vehicle_id
```

### قواعد الحذف والتحديث

| العلاقة | عند الحذف | عند التحديث |
|---------|-----------|-------------|
| buildings → residential_units | CASCADE | CASCADE |
| residential_units → residents | SET NULL | CASCADE |
| residents → vehicles | SET NULL | CASCADE |
| vehicles → vehicle_stickers | CASCADE | CASCADE |
| vehicles → traffic_violations | SET NULL | CASCADE |

---

## 👁️ العروض (Views)

### 1. v_buildings_summary

عرض ملخص شامل للمباني مع الإحصائيات.

```sql
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
```

**الاستخدام:**
```sql
SELECT * FROM v_buildings_summary WHERE building_category = 'قديم';
```

---

### 2. v_vehicles_with_residents

عرض السيارات مع معلومات السكان والوحدات.

```sql
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
```

---

### 3. v_violations_detailed

عرض المخالفات مع التفاصيل الكاملة.

```sql
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
```

---

### 4. v_parking_statistics

عرض إحصائيات المواقف.

```sql
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
```

---

## ⚙️ الإجراءات المخزنة

### 1. sp_update_building_statistics

تحديث إحصائيات المبنى تلقائياً.

```sql
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
```

**الاستخدام:**
```sql
CALL sp_update_building_statistics(1);
```

---

### 2. sp_get_repeat_violators

البحث عن السيارات المتكررة في المخالفات.

```sql
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
```

**الاستخدام:**
```sql
-- البحث عن السيارات التي لديها 3 مخالفات أو أكثر
CALL sp_get_repeat_violators(3);
```

---

### 3. sp_violations_by_type

إحصائيات المخالفات حسب النوع.

```sql
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
```

**الاستخدام:**
```sql
-- إحصائيات المخالفات لشهر نوفمبر 2023
CALL sp_violations_by_type('2023-11-01', '2023-11-30');
```

---

## 🔔 المشغلات (Triggers)

### 1. tr_update_unit_on_resident_insert

تحديث حالة الوحدة تلقائياً عند إضافة ساكن.

```sql
DELIMITER //
CREATE TRIGGER tr_update_unit_on_resident_insert
AFTER INSERT ON residents
FOR EACH ROW
BEGIN
    IF NEW.unit_id IS NOT NULL THEN
        UPDATE residential_units 
        SET is_occupied = TRUE, occupancy_status = 'مشغول'
        WHERE id = NEW.unit_id;
        
        CALL sp_update_building_statistics(
            (SELECT building_id FROM residential_units WHERE id = NEW.unit_id)
        );
    END IF;
END //
DELIMITER ;
```

---

### 2. tr_update_unit_on_resident_delete

تحديث حالة الوحدة تلقائياً عند حذف ساكن.

```sql
DELIMITER //
CREATE TRIGGER tr_update_unit_on_resident_delete
AFTER DELETE ON residents
FOR EACH ROW
BEGIN
    IF OLD.unit_id IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM residents WHERE unit_id = OLD.unit_id AND is_active = TRUE) = 0 THEN
            UPDATE residential_units 
            SET is_occupied = FALSE, occupancy_status = 'شاغر'
            WHERE id = OLD.unit_id;
        END IF;
        
        CALL sp_update_building_statistics(
            (SELECT building_id FROM residential_units WHERE id = OLD.unit_id)
        );
    END IF;
END //
DELIMITER ;
```

---

### 3. tr_log_violation_insert

تسجيل النشاط تلقائياً عند إضافة مخالفة.

```sql
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
```

---

## 📊 أمثلة الاستعلامات

### 1. البحث عن سيارة بواسطة رقم اللوحة

```sql
SELECT * FROM v_vehicles_with_residents 
WHERE plate_number = 'ABC1234';
```

---

### 2. عرض جميع المخالفات لساكن معين

```sql
SELECT * FROM v_violations_detailed 
WHERE national_id = '1012345678'
ORDER BY violation_date DESC;
```

---

### 3. عرض الشقق الشاغرة

```sql
SELECT 
    ru.unit_name,
    b.building_name,
    b.building_category,
    ru.floor_number
FROM residential_units ru
INNER JOIN buildings b ON ru.building_id = b.id
WHERE ru.is_occupied = FALSE
ORDER BY b.building_number, ru.unit_number;
```

---

### 4. إحصائيات المخالفات في المباني القديمة

```sql
SELECT 
    b.building_name,
    COUNT(tv.id) as violations_count,
    SUM(tv.fine_amount) as total_fines
FROM buildings b
LEFT JOIN traffic_violations tv ON b.id = tv.building_id
WHERE b.building_category = 'قديم'
GROUP BY b.id
ORDER BY violations_count DESC;
```

---

### 5. السكان الذين لديهم أكثر من سيارة

```sql
SELECT 
    r.full_name,
    r.national_id,
    ru.unit_name,
    COUNT(v.id) as vehicles_count,
    GROUP_CONCAT(v.plate_number SEPARATOR ', ') as plate_numbers
FROM residents r
INNER JOIN vehicles v ON r.id = v.resident_id
LEFT JOIN residential_units ru ON r.unit_id = ru.id
GROUP BY r.id
HAVING vehicles_count > 1
ORDER BY vehicles_count DESC;
```

---

### 6. المواقف المتاحة حسب النوع

```sql
SELECT * FROM v_parking_statistics
ORDER BY parking_type;
```

---

### 7. السيارات بدون ملصق فعال

```sql
SELECT 
    v.plate_number,
    v.vehicle_make,
    v.vehicle_model,
    r.full_name,
    ru.unit_name
FROM vehicles v
LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id AND vs.sticker_status = 'فعال'
LEFT JOIN residents r ON v.resident_id = r.id
LEFT JOIN residential_units ru ON r.unit_id = ru.id
WHERE vs.id IS NULL AND v.is_registered = TRUE;
```

---

### 8. تقرير المخالفات الشهري

```sql
SELECT 
    DATE_FORMAT(violation_date, '%Y-%m') as month,
    violation_type,
    COUNT(*) as count,
    SUM(fine_amount) as total_fines,
    SUM(CASE WHEN is_paid = TRUE THEN 1 ELSE 0 END) as paid_count
FROM traffic_violations
WHERE violation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY month, violation_type
ORDER BY month DESC, count DESC;
```

---

## 🔌 التكامل مع Plate Recognizer

### بيانات الاتصال

```json
{
  "api_token": "22ba3cf7155a1ea730a0b64787f98ab5f9a3de94",
  "api_url": "https://api.platerecognizer.com/v1/plate-reader/",
  "parkpow_token": "7c13be422713a758a42a0bc453cf3331fbfd346",
  "ftp_host": "ftp.platerecognizer.com",
  "ftp_username": "aliayashi522",
  "ftp_password": "708c4bbfdde0",
  "timezone": "Asia/Riyadh"
}
```

### سير العمل

1. **رفع الصورة** إلى Plate Recognizer API
2. **استقبال النتائج** (رقم اللوحة، نوع المركبة، اللون، نسبة الدقة)
3. **حفظ البيانات** في جدول `analyzed_images`
4. **المطابقة** مع جدول `vehicles` بواسطة `plate_number`
5. **تحديث** `is_matched` و `matched_vehicle_id`
6. **إنشاء مخالفة** تلقائياً إذا لزم الأمر
7. **تحديث** `repeat_count` للسيارات المتكررة

### مثال استعلام للمطابقة

```sql
-- مطابقة الصور المحللة مع السيارات المسجلة
UPDATE analyzed_images ai
INNER JOIN vehicles v ON ai.plate_number = v.plate_number
SET 
    ai.is_matched = TRUE,
    ai.matched_vehicle_id = v.id
WHERE ai.is_matched = FALSE;
```

---

## 📈 الإحصائيات المتوقعة

| البيان | العدد المتوقع |
|--------|---------------|
| **إجمالي المباني** | 165 (30 قديم + 21 جديد + 114 فلة) |
| **إجمالي الوحدات** | 1,134 وحدة |
| **الوحدات المشغولة** | 1,082 وحدة |
| **معدل الإشغال** | 95.4% |
| **إجمالي السكان** | 1,057 ساكن |
| **المواقف الخاصة** | 1,020 موقف |
| **المواقف العامة** | 241 موقف |
| **مواقف المعاقين** | 39 موقف (18 في عمارة 18، 21 في عمارة 79) |
| **إجمالي المواقف** | 1,300 موقف |

---

## 🔒 الأمان والصلاحيات

### توصيات الأمان

1. **تشفير كلمات المرور:** استخدام bcrypt مع salt
2. **تقييد الوصول:** استخدام roles و permissions
3. **تسجيل النشاطات:** جميع العمليات تُسجل في activity_log
4. **النسخ الاحتياطي:** يومي تلقائي
5. **SSL/TLS:** لجميع الاتصالات
6. **SQL Injection Prevention:** استخدام Prepared Statements

### الصلاحيات حسب الدور

| الدور | الصلاحيات |
|------|-----------|
| **admin** | وصول كامل لجميع الجداول والعمليات |
| **violations_officer** | إضافة وتعديل المخالفات فقط |
| **inquiry_user** | استعلام وعرض التقارير فقط (قراءة) |
| **manager** | عرض التقارير والإحصائيات |

---

## 🚀 التثبيت والإعداد

### 1. إنشاء قاعدة البيانات

```bash
mysql -u root -p < schema.sql
```

### 2. إدراج البيانات التجريبية (اختياري)

```bash
mysql -u root -p traffic_management_system < sample_data.sql
```

### 3. إنشاء مستخدم قاعدة البيانات

```sql
CREATE USER 'traffic_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON traffic_management_system.* TO 'traffic_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 📞 الدعم والتواصل

**وحدة إسكان هيئة التدريس**  
**جامعة الإمام محمد بن سعود الإسلامية**

📧 البريد الإلكتروني: housing@imam.edu.sa  
📱 الهاتف: +966-11-XXXXXXX

---

## 📝 سجل التحديثات

| الإصدار | التاريخ | التحديثات |
|---------|--------|-----------|
| 1.0 | نوفمبر 2025 | الإصدار الأول - المخطط الكامل |

---

**© 2025 جامعة الإمام محمد بن سعود الإسلامية - جميع الحقوق محفوظة**
