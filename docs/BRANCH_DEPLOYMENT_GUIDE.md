# دليل دمج الفروع والنشر - Branch Linking and Deployment Guide

## 📋 نظرة عامة / Overview

هذا الدليل يشرح كيفية دمج (ربط) الفروع المختلفة ونشر النظام على الإنترنت.

This guide explains how to link (merge) different branches and deploy the system.

---

## 🔗 دمج الفروع / Linking Branches

### الفروع الموجودة / Available Branches

المشروع يحتوي على فروع متعددة تم تطويرها بشكل منفصل:

| الفرع | الوصف | الحالة |
|-------|-------|--------|
| `main` | الفرع الرئيسي | ✅ للنشر |
| `copilot/add-database-and-api-setup` | إعداد قاعدة البيانات وAPI | ✅ مدمج |
| `copilot/add-dockerfile-for-deployment` | إعداد Docker | ✅ مدمج |
| `copilot/add-traffic-dashboard` | لوحة المرور | ✅ مدمج |

### كيفية دمج فرع / How to Merge a Branch

```bash
# 1. التبديل إلى الفرع الرئيسي / Switch to main branch
git checkout main

# 2. سحب آخر التحديثات / Pull latest changes
git pull origin main

# 3. دمج الفرع المطلوب / Merge the desired branch
git merge origin/copilot/branch-name

# 4. حل أي تعارضات إن وجدت / Resolve any conflicts if present
# افتح الملفات المتعارضة وقم بحل التعارضات يدوياً
# Open conflicting files and resolve manually

# 5. إتمام الدمج / Complete the merge
git add .
git commit -m "Merge branch-name into main"

# 6. الرفع للمستودع / Push to repository
git push origin main
```

---

## 🚀 خيارات النشر / Deployment Options

### 1️⃣ Render (الأسهل / Easiest)

النظام مُعد للنشر على Render مباشرة:

**خطوات النشر:**

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. انقر على "New +" → "Web Service"
3. اربط حسابك بـ GitHub واختر هذا المستودع
4. Render سيستخدم ملف `render.yaml` تلقائياً
5. أضف متغيرات البيئة:
   - `DATABASE_URL`: رابط قاعدة البيانات PostgreSQL
   - `NODE_ENV`: production
   - `DB_SSL`: true

**قاعدة البيانات:**
- يمكنك إنشاء قاعدة بيانات مجانية على [Neon](https://neon.tech) أو [Supabase](https://supabase.com)

### 2️⃣ Docker (النشر الذاتي / Self-hosted)

```bash
# التشغيل مع قاعدة البيانات محلياً
docker compose up -d

# عرض السجلات
docker compose logs -f

# الإيقاف
docker compose down
```

**الوصول:** `http://localhost:3000`

### 3️⃣ Railway

1. اذهب إلى [Railway](https://railway.app)
2. انشئ مشروع جديد وربطه بـ GitHub
3. Railway سيكتشف Dockerfile تلقائياً
4. أضف خدمة PostgreSQL من marketplace

### 4️⃣ Fly.io

```bash
# تثبيت flyctl
curl -L https://fly.io/install.sh | sh

# تسجيل الدخول
flyctl auth login

# إنشاء التطبيق
flyctl launch

# النشر
flyctl deploy
```

### 5️⃣ Heroku

```bash
# تثبيت Heroku CLI
# تسجيل الدخول
heroku login

# إنشاء التطبيق
heroku create university-traffic-system

# إضافة قاعدة البيانات
heroku addons:create heroku-postgresql:essential-0

# النشر
git push heroku main
```

---

## ⚙️ إعدادات GitHub Actions

تم إضافة سير عمل (workflow) لـ GitHub Actions في `.github/workflows/deploy.yml`:

**ما يفعله السير:**
1. ✅ اختبار التطبيق عند كل Push
2. ✅ بناء صورة Docker
3. ✅ التحقق من صحة الإعدادات
4. ✅ إظهار ملخص النشر

**تفعيل النشر التلقائي:**
- أي push للفرع `main` سيُشغّل السير تلقائياً
- يمكنك أيضاً تشغيله يدوياً من تبويب Actions

---

## 🔐 متغيرات البيئة المطلوبة / Required Environment Variables

| المتغير | الوصف | مثال |
|---------|-------|------|
| `DATABASE_URL` | رابط PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | بيئة التشغيل | `production` |
| `PORT` | منفذ التطبيق | `3000` |
| `DB_SSL` | تفعيل SSL | `true` |

---

## 📝 قائمة التحقق للنشر / Deployment Checklist

```
قبل النشر / Before Deployment:
✅ تأكد من دمج جميع الفروع المطلوبة في main
✅ تأكد من عدم وجود أخطاء في الكود
✅ تأكد من تحديث متغيرات البيئة
✅ تأكد من تغيير كلمات المرور الافتراضية
✅ تأكد من إعداد قاعدة البيانات

بعد النشر / After Deployment:
✅ اختبر تسجيل الدخول
✅ اختبر جميع الصفحات الرئيسية
✅ تأكد من اتصال قاعدة البيانات
✅ راقب السجلات للأخطاء
```

---

## 🆘 حل المشاكل / Troubleshooting

### مشكلة: التطبيق لا يعمل
```bash
# تحقق من السجلات
docker compose logs app

# أو على Render
# اذهب إلى Dashboard → Logs
```

### مشكلة: قاعدة البيانات لا تتصل
```bash
# تأكد من DATABASE_URL صحيح
# تأكد من DB_SSL=true للخدمات السحابية
```

### مشكلة: الصفحات لا تظهر
```bash
# تأكد من أن المنفذ 3000 مفتوح
# تحقق من أن الملفات الثابتة موجودة
```

---

## 📞 الدعم / Support

- 📖 [README.md](README.md) - دليل المشروع
- 🔒 [SECURITY.md](SECURITY.md) - إرشادات الأمان
- 🐳 [docker_deployment.html](docker_deployment.html) - دليل Docker
- ☁️ [CLOUD_DATABASE_GUIDE.md](CLOUD_DATABASE_GUIDE.md) - دليل قاعدة البيانات السحابية

---

**آخر تحديث:** 2025-11-26
