# ⚡ الإعداد السريع لقاعدة البيانات السحابية

## 5 دقائق فقط! 🚀

### الخطوة 1: إنشاء قاعدة بيانات Supabase (مجاني)

1. اذهب إلى https://supabase.com
2. اضغط "Start your project"
3. سجّل دخول بـ GitHub
4. اضغط "New Project"
5. أدخل:
   - **Name:** traffic-system
   - **Password:** اختر كلمة مرور قوية (احفظها!)
   - **Region:** اختر الأقرب لك
6. اضغط "Create new project" وانتظر 2-3 دقائق

### الخطوة 2: الحصول على Connection String

1. في Supabase، اذهب إلى **Settings** (أيقونة الترس)
2. اختر **Database** من القائمة
3. انزل إلى **Connection String**
4. اختر تبويب **URI**
5. انسخ النص الكامل (سيكون مثل):
   ```
   postgresql://postgres.[xxx]:[password]@[xxx].supabase.co:5432/postgres
   ```
6. استبدل `[password]` بكلمة المرور التي اخترتها

### الخطوة 3: إعداد المشروع

افتح Terminal في مجلد المشروع:

```bash
# تثبيت المتطلبات
npm install

# إنشاء ملف البيئة
cp .env.example .env
```

افتح ملف `.env` بأي محرر نصوص والصق Connection String:
```env
DATABASE_URL=postgresql://postgres.[xxx]:YOUR_PASSWORD@[xxx].supabase.co:5432/postgres
DB_SSL=true
PORT=3000
```

احفظ الملف!

### الخطوة 4: تهيئة قاعدة البيانات

```bash
npm run setup
```

عندما يسأل:
- `Do you want to initialize the database schema?` → اكتب `yes`
- `Do you want to create default users?` → اكتب `yes`

### الخطوة 5: تشغيل النظام

```bash
npm start
```

افتح المتصفح على: **http://localhost:3000**

---

## 🔑 بيانات الدخول

- **Admin:** admin / admin123
- **Officer:** violations_officer / officer123
- **Inquiry:** inquiry_user / inquiry123

---

## ✅ تم! النظام يعمل الآن مع قاعدة بيانات سحابية!

### التالي:
- غيّر كلمات المرور الافتراضية
- أضف بيانات اختبارية
- استكشف النظام

---

## 🆘 مشاكل؟

### "Connection failed"
- تحقق من كلمة المرور في Connection String
- تأكد من اتصالك بالإنترنت
- في Supabase: Settings → Database → أضف `0.0.0.0/0` في SSL enforcement

### "Port 3000 already in use"
```bash
# في .env غيّر PORT إلى 3001 أو أي رقم آخر
PORT=3001
```

### "Module not found"
```bash
npm install
```

---

📖 للمزيد من التفاصيل: [DATABASE_CONNECTION_AR.md](DATABASE_CONNECTION_AR.md)
