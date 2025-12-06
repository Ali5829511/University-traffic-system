# Netlify Functions - نظام إدارة المرور الجامعي
# Netlify Functions - University Traffic Management System

## نظرة عامة / Overview

هذا المجلد يحتوي على وظائف Netlify بدون خادم (Serverless Functions) التي توفر API خلفي للنظام.

This directory contains Netlify serverless functions that provide the backend API for the system.

## الوظائف المتاحة / Available Functions

### 1. health.js
**المسار / Path:** `/.netlify/functions/health` أو `/api/health`

**الوصف:** فحص صحة النظام / Health check endpoint

**الاستخدام:**
```javascript
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

**الاستجابة / Response:**
```json
{
  "success": true,
  "message": "University Traffic System is running",
  "timestamp": "2025-12-06T19:16:00.000Z",
  "environment": "production",
  "version": "5.0"
}
```

## إضافة وظائف جديدة / Adding New Functions

### الهيكل الأساسي / Basic Structure

```javascript
// netlify/functions/my-function.js

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Your logic here
        const data = { message: 'Hello' };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### الاتصال بقاعدة البيانات / Database Connection

```javascript
// netlify/functions/get-violations.js
const { Pool } = require('pg');

exports.handler = async (event, context) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        const result = await pool.query('SELECT * FROM violations LIMIT 10');
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.rows)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        await pool.end();
    }
};
```

## ترحيل Express Routes إلى Netlify Functions
## Migrating Express Routes to Netlify Functions

### قبل (Express) / Before (Express):
```javascript
app.get('/api/violations', async (req, res) => {
    const result = await db.query('SELECT * FROM violations');
    res.json(result.rows);
});
```

### بعد (Netlify Function) / After (Netlify Function):
```javascript
// netlify/functions/violations.js
exports.handler = async (event) => {
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query('SELECT * FROM violations');
    await pool.end();
    
    return {
        statusCode: 200,
        body: JSON.stringify(result.rows)
    };
};
```

## معلومات مهمة / Important Information

### الحدود / Limits (Free Tier)
- ⏱️ **Timeout:** 10 ثوانٍ / 10 seconds
- 📦 **Size:** 50 MB (حجم الوظيفة / function size)
- 🔄 **Requests:** 125,000 طلب/شهر / requests/month
- ⚡ **Execution:** 100 ساعة/شهر / hours/month

### أفضل الممارسات / Best Practices

1. **استخدم Connection Pooling:**
```javascript
// ❌ سيء / Bad
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// ✅ جيد / Good
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

2. **أغلق الاتصالات دائماً:**
```javascript
try {
    // code
} finally {
    await pool.end(); // Always close!
}
```

3. **استخدم متغيرات البيئة:**
```javascript
// ✅ جيد / Good
process.env.DATABASE_URL

// ❌ سيء / Bad
'postgresql://user:pass@host/db'
```

4. **أضف CORS Headers:**
```javascript
// ⚠️ للإنتاج: استخدم النطاق المحدد بدلاً من '*'
// ⚠️ Production: Use specific domain instead of '*'
const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
};

// في Netlify Environment Variables أضف:
// ALLOWED_ORIGIN=https://your-domain.netlify.app
```

## التطوير المحلي / Local Development

### تثبيت Netlify CLI:
```bash
npm install -g netlify-cli
```

### تشغيل محلياً:
```bash
# في مجلد المشروع / In project directory
netlify dev
```

### اختبار وظيفة:
```bash
curl http://localhost:8888/.netlify/functions/health
```

## الموارد / Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Netlify Functions Examples](https://functions.netlify.com/examples/)
- [PostgreSQL Node.js](https://node-postgres.com/)

## الحصول على المساعدة / Getting Help

إذا واجهت مشاكل:
1. راجع سجلات الوظائف في Netlify Dashboard
2. تحقق من متغيرات البيئة
3. راجع [NETLIFY_DEPLOYMENT.md](../docs/NETLIFY_DEPLOYMENT.md)

If you encounter issues:
1. Check function logs in Netlify Dashboard
2. Verify environment variables
3. Review [NETLIFY_DEPLOYMENT.md](../docs/NETLIFY_DEPLOYMENT.md)
