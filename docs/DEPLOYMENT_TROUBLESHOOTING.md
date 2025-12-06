# 🔧 دليل حل مشاكل النشر - Deployment Troubleshooting Guide
# نظام إدارة المرور الجامعي / University Traffic Management System

**آخر تحديث / Last Updated:** 2025-12-06

---

## 📋 جدول المحتويات / Table of Contents

1. [مشاكل Netlify](#مشاكل-netlify--netlify-issues)
2. [مشاكل قاعدة البيانات](#مشاكل-قاعدة-البيانات--database-issues)
3. [مشاكل المصادقة](#مشاكل-المصادقة--authentication-issues)
4. [مشاكل الأداء](#مشاكل-الأداء--performance-issues)
5. [مشاكل الأمان](#مشاكل-الأمان--security-issues)
6. [أخطاء شائعة](#أخطاء-شائعة--common-errors)

---

## 🌐 مشاكل Netlify / Netlify Issues

### المشكلة: "Build failed" - فشل البناء

**الأعراض:**
```
❌ Build failed
❌ Error during build
```

**الحلول:**

#### 1. تحقق من سجل البناء / Check Build Log
```
1. اذهب إلى Netlify Dashboard
2. Deploys > [Failed Deploy]
3. اضغط على Deploy log
4. ابحث عن السطر الذي يبدأ بـ ERROR
```

#### 2. مشاكل شائعة في البناء:

**أ. Missing dependencies**
```bash
# الخطأ / Error:
Cannot find module 'express'

# الحل / Solution:
تأكد من أن package.json موجود
تأكد من أن Build command صحيح: npm install
```

**ب. Wrong Node version**
```bash
# الخطأ / Error:
Node version not supported

# الحل / Solution:
في netlify.toml تحقق من:
NODE_VERSION = "18.17.0"
```

**ج. Invalid netlify.toml**
```bash
# الخطأ / Error:
Error parsing netlify.toml

# الحل / Solution:
1. تحقق من صحة TOML syntax
2. استخدم: https://www.toml-lint.com/
3. قارن مع النموذج في المستودع
```

---

### المشكلة: "Page not found" (404) - الصفحة غير موجودة

**الأعراض:**
```
✅ Build succeeded
❌ Page shows 404 Not Found
```

**الحلول:**

#### 1. تحقق من Publish Directory
```
Site settings > Build & deploy > Build settings
Publish directory: src/public ✅ (يجب أن تكون هكذا)
```

#### 2. تحقق من ملف _redirects
```bash
# يجب أن يوجد في: src/public/_redirects
# المحتوى الأساسي:
/                           /pages/index.html           200
/api/*                      /.netlify/functions/:splat  200
/*                          /pages/index.html           404
```

#### 3. مسارات الملفات
```
✅ صحيح / Correct:   /pages/home.html
❌ خطأ / Wrong:      /home.html
```

---

### المشكلة: "Function timeout" - انتهاء وقت الوظيفة

**الأعراض:**
```
❌ Function execution timed out after 10 seconds
❌ 504 Gateway Timeout
```

**الحلول:**

#### 1. قلل من البيانات المُعالَجة
```javascript
// ❌ سيء / Bad
const result = await db.query('SELECT * FROM violations'); // جميع البيانات

// ✅ جيد / Good
const result = await db.query('SELECT * FROM violations LIMIT 100'); // محدود
```

#### 2. استخدم Pagination
```javascript
// إضافة pagination
const page = parseInt(event.queryStringParameters.page) || 1;
const limit = 20;
const offset = (page - 1) * limit;

const result = await db.query(
    'SELECT * FROM violations LIMIT $1 OFFSET $2',
    [limit, offset]
);
```

#### 3. حسّن الاستعلامات
```sql
-- ❌ بطيء / Slow
SELECT * FROM violations WHERE plate_number LIKE '%ABC%';

-- ✅ سريع / Fast
SELECT * FROM violations WHERE plate_number = 'ABC123';
-- أضف index على plate_number
CREATE INDEX idx_plate_number ON violations(plate_number);
```

---

## 💾 مشاكل قاعدة البيانات / Database Issues

### المشكلة: "Database connection failed"

**الأعراض:**
```
❌ Error: connect ECONNREFUSED
❌ password authentication failed
❌ database "traffic_system" does not exist
```

**الحلول:**

#### 1. تحقق من DATABASE_URL
```bash
# في Netlify: Site settings > Environment variables

# التنسيق الصحيح / Correct format:
DATABASE_URL=postgresql://user:password@host:5432/database

# أمثلة / Examples:
# Supabase:
postgresql://postgres.xxxxx:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Neon:
postgresql://user:[password]@ep-xxxxx.us-east-2.aws.neon.tech/neondb
```

#### 2. تحقق من DB_SSL
```bash
# للقواعد السحابية (Supabase, Neon):
DB_SSL=true ✅

# للقواعد المحلية:
DB_SSL=false
```

#### 3. اختبر الاتصال
```bash
# استخدم pgAdmin أو DBeaver
# أو استخدم psql:
psql "postgresql://user:password@host:5432/database"
```

---

### المشكلة: "Schema not found" - الجداول غير موجودة

**الأعراض:**
```
❌ relation "violations" does not exist
❌ relation "users" does not exist
```

**الحل:**

```sql
-- في Supabase SQL Editor:
-- أو في قاعدة البيانات مباشرة:

-- 1. افتح ملف schema.postgres.sql من المستودع
-- 2. انسخ المحتوى كاملاً
-- 3. نفذه في SQL Editor

-- أو استخدم:
\i /path/to/schema.postgres.sql
```

**التحقق:**
```sql
-- تحقق من الجداول الموجودة:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- يجب أن تظهر:
-- ✅ users
-- ✅ violations
-- ✅ vehicles
-- ✅ residential_units
-- ... إلخ
```

---

### المشكلة: "Too many connections"

**الأعراض:**
```
❌ Error: too many clients already
❌ remaining connection slots are reserved
```

**الحلول:**

#### 1. أغلق الاتصالات دائماً
```javascript
// ❌ سيء / Bad
const client = new Client();
await client.connect();
// ... code
// لم يتم إغلاق الاتصال!

// ✅ جيد / Good
const pool = new Pool();
try {
    const result = await pool.query('...');
} finally {
    await pool.end(); // ✅ إغلاق!
}
```

#### 2. استخدم Connection Pooling
```javascript
// في Netlify Function:
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // حد أقصى اتصال واحد لكل function
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

#### 3. زد حد الاتصالات في Supabase
```
Dashboard > Database > Settings
Connection pooling: Enable
Max connections: increase limit
```

---

## 🔐 مشاكل المصادقة / Authentication Issues

### المشكلة: "Cannot login" - لا يمكن تسجيل الدخول

**الأعراض:**
```
❌ Invalid username or password
❌ Login button does nothing
❌ Redirects to login page
```

**الحلول:**

#### 1. تحقق من بيانات الاعتماد الافتراضية
```
اسم المستخدم / Username: admin
كلمة المرور / Password: admin123

إذا تم تغييرها:
1. اذهب إلى قاعدة البيانات
2. استعلم:
   SELECT username FROM users;
3. لإعادة تعيين كلمة المرور:
   UPDATE users 
   SET password = '$2a$10$...' -- bcrypt hash
   WHERE username = 'admin';
```

#### 2. تحقق من جدول users
```sql
-- تحقق من وجود المستخدمين:
SELECT * FROM users;

-- إذا كان فارغاً، أضف مستخدم:
INSERT INTO users (username, password, role, full_name)
VALUES (
    'admin',
    '$2a$10$YourBcryptHashHere',
    'admin',
    'System Administrator'
);
```

#### 3. مشاكل bcrypt
```javascript
// تأكد من أن bcryptjs مثبت:
npm list bcryptjs

// في الكود:
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('admin123', 10);
console.log(hash); // استخدم هذا في قاعدة البيانات
```

---

### المشكلة: "Session expired" - انتهت الجلسة

**الأعراض:**
```
❌ يتم تسجيل الخروج تلقائياً
❌ يجب تسجيل الدخول مراراً
```

**الحلول:**

#### 1. تحقق من localStorage
```javascript
// في Console المتصفح:
console.log(localStorage.getItem('user'));

// إذا كان null:
// 1. تحقق من أن تسجيل الدخول ينجح
// 2. تحقق من CORS headers
```

#### 2. مشكلة CORS
```javascript
// في Netlify Function:
const headers = {
    'Access-Control-Allow-Origin': '*', // أو النطاق المحدد
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
};
```

---

## 🚀 مشاكل الأداء / Performance Issues

### المشكلة: "Site is slow" - الموقع بطيء

**الحلول:**

#### 1. تفعيل Asset Optimization
```
Site settings > Build & deploy > Post processing
✅ Bundle CSS
✅ Bundle JS
✅ Minify CSS
✅ Minify JS
✅ Pretty URLs
```

#### 2. ضغط الصور
```bash
# استخدم أدوات ضغط الصور:
# - TinyPNG
# - ImageOptim
# - Squoosh

# الحد الأقصى الموصى به:
# أيقونات: < 10KB
# صور المحتوى: < 100KB
# صور الخلفية: < 200KB
```

#### 3. استخدم Lazy Loading
```html
<!-- للصور: -->
<img src="image.jpg" loading="lazy" alt="Description">
```

---

### المشكلة: "High database response time"

**الحلول:**

#### 1. أضف Indexes
```sql
-- على الأعمدة المستخدمة في WHERE و JOIN:
CREATE INDEX idx_violations_date ON violations(violation_date);
CREATE INDEX idx_violations_plate ON violations(plate_number);
CREATE INDEX idx_violations_status ON violations(status);
```

#### 2. استخدم EXPLAIN ANALYZE
```sql
-- لفهم بطء الاستعلام:
EXPLAIN ANALYZE 
SELECT * FROM violations WHERE plate_number = 'ABC123';

-- ابحث عن:
-- Seq Scan → سيء (يحتاج index)
-- Index Scan → جيد
```

---

## 🔒 مشاكل الأمان / Security Issues

### المشكلة: "Security warning" - تحذير أمني

**الحلول:**

#### 1. غيّر كلمات المرور الافتراضية
```
⚠️ حرج! / CRITICAL!

1. سجل دخول كـ admin
2. إدارة المستخدمين
3. غيّر كلمات المرور:
   - admin
   - violations
   - inquiry
```

#### 2. مراجعة Environment Variables
```
❌ لا تشارك أبداً:
- DATABASE_URL
- API Keys
- Passwords

✅ استخدم Netlify Environment Variables فقط
```

#### 3. تفعيل HTTPS
```
✅ تلقائي في Netlify
Domain settings > HTTPS
✅ Force HTTPS
```

---

## ⚠️ أخطاء شائعة / Common Errors

### خطأ: "CORS policy blocked"

```javascript
// الحل / Solution:
// في كل Netlify Function، أضف:
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// معالجة OPTIONS:
if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
}
```

---

### خطأ: "Module not found"

```bash
# الحل / Solution:
# 1. تحقق من package.json:
npm list [package-name]

# 2. أعد التثبيت:
rm -rf node_modules package-lock.json
npm install

# 3. في Netlify:
# أعد deploy من dashboard
```

---

### خطأ: "Cannot read property 'rows' of undefined"

```javascript
// السبب / Cause:
// الاستعلام فشل لكن لم يتم معالجة الخطأ

// الحل / Solution:
try {
    const result = await pool.query('SELECT * FROM violations');
    if (!result || !result.rows) {
        throw new Error('Query returned no results');
    }
    return result.rows;
} catch (error) {
    console.error('Database error:', error);
    throw error;
}
```

---

## 🆘 الحصول على المساعدة / Getting Help

### 1. تحقق من السجلات / Check Logs

**Netlify:**
```
Deploys > [Your Deploy] > Deploy log
Functions > [Function] > Function log
```

**Supabase:**
```
Database > Logs
```

### 2. استخدم أدوات التشخيص

```bash
# اختبار API:
curl https://your-site.netlify.app/api/health

# اختبار قاعدة البيانات:
psql $DATABASE_URL

# اختبار محلياً:
netlify dev
```

### 3. الموارد

- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [دليل النشر](NETLIFY_DEPLOYMENT.md)
- [دليل 5 دقائق](DEPLOY_IN_5_MINUTES.md)

---

## ✅ قائمة التحقق للمشاكل / Problem Checklist

عند مواجهة مشكلة، تحقق من:

- [ ] Build نجح في Netlify
- [ ] Deploy نجح في Netlify
- [ ] DATABASE_URL صحيح في Environment variables
- [ ] DB_SSL=true للقواعد السحابية
- [ ] Schema تم تنفيذه في قاعدة البيانات
- [ ] جدول users يحتوي على بيانات
- [ ] كلمات المرور صحيحة
- [ ] CORS headers موجودة في Functions
- [ ] لا توجد أخطاء في Console المتصفح
- [ ] لا توجد أخطاء في Function logs

---

**آخر تحديث / Last Updated:** 2025-12-06  
**النسخة / Version:** 1.0

**نهاية الدليل / End of Guide**
