# ============================================
# Dockerfile - نظام إدارة المرور الجامعي
# University Traffic Management System
# ============================================

# استخدام صورة Node.js الرسمية / Using official Node.js image
FROM node:18-alpine

# تعيين مجلد العمل داخل الحاوية / Set working directory inside container
WORKDIR /app

# تثبيت الأدوات اللازمة للاتصال بقاعدة البيانات / Install necessary tools for database connection
RUN apk add --no-cache postgresql-client curl

# نسخ ملفات package.json لتثبيت المكتبات أولاً (للتخزين المؤقت) / Copy package files first for caching
COPY package*.json ./

# تثبيت المكتبات / Install dependencies
RUN npm ci --only=production

# نسخ ملفات المشروع / Copy project files
COPY . .

# إنشاء مجلدات للتحميلات والنتائج / Create directories for uploads and results
RUN mkdir -p uploads data/images data/results reports && \
    chown -R node:node /app

# التبديل إلى مستخدم غير root للأمان / Switch to non-root user for security
USER node

# تعيين متغيرات البيئة الافتراضية / Set default environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DB_SSL=true

# فتح المنفذ / Expose port
EXPOSE 3000

# فحص الصحة / Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# تشغيل السيرفر / Start server
CMD ["npm", "start"]
