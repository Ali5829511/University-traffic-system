 * نظام إدارة قاعدة البيانات المحلية
 * Local Database Management System
 * @version 1.0.0
 * 
 * ⚠️ تحذير أمني مهم:
 * هذا النظام مصمم للتطوير والاختبار فقط!
 * 
 * في بيئة الإنتاج، يجب:
 * 1. استخدام قاعدة بيانات حقيقية (PostgreSQL, MySQL, MongoDB)
 * 2. تشفير كلمات المرور باستخدام bcrypt أو argon2
 * 3. استخدام API خلفي آمن بدلاً من localStorage
 * 4. تطبيق SSL/TLS (HTTPS)
 * 5. إضافة معالجة الأخطاء والتحقق من صحة البيانات
 * 6. تطبيق rate limiting و CSRF protection
 * 
 * 📊 للتحقق من حالة قاعدة البيانات، افتح: database_status.html
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'TrafficSystemDB';
        this.version = 1;
        this.dbType = 'localStorage'; // نوع قاعدة البيانات
        this.connectionStatus = 'disconnected'; // حالة الاتصال
        this.init();
    }

    /**
     * تهيئة قاعدة البيانات
     */
    init() {
        try {
            // التحقق من دعم localStorage
            if (typeof localStorage === 'undefined') {
                console.error('localStorage غير مدعوم في هذا المتصفح');
                this.connectionStatus = 'error';
                return;
            }

            // إنشاء المستخدمين الافتراضيين إذا لم يكونوا موجودين
            if (!localStorage.getItem('users')) {
                this.initializeDefaultUsers();
            }
            
            // إنشاء جدول المخالفات إذا لم يكن موجوداً
            if (!localStorage.getItem('violations')) {
                localStorage.setItem('violations', JSON.stringify([]));
            }

            // إنشاء جدول الملصقات إذا لم يكن موجوداً
            if (!localStorage.getItem('stickers')) {
                this.initializeDefaultStickers();
            }

            // تحديث حالة الاتصال
            this.connectionStatus = 'connected';
            console.log('✓ قاعدة البيانات متصلة بنجاح (localStorage)');
            console.log('📊 للتحقق من الحالة، افتح: database_status.html');
        } catch (error) {
            console.error('خطأ في تهيئة قاعدة البيانات:', error);
            this.connectionStatus = 'error';
        }
    }

    /**
     * الحصول على حالة الاتصال
     */
    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            type: this.dbType,
            name: this.dbName,
            version: this.version,
            isConnected: this.connectionStatus === 'connected'
        };
    }

    /**
     * إنشاء المستخدمين الافتراضيين
     * 
     * ⚠️ ملاحظة: كلمات المرور مخزنة بنص عادي للتطوير فقط
     * في الإنتاج: استخدم bcrypt لتشفير كلمات المرور
     */
    initializeDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123', // ⚠️ في نظام حقيقي، يجب تشفير كلمة المرور
                name: 'مدير النظام',
                email: 'admin@university.edu.sa',
                role: 'admin',
                status: 'active',
                createdDate: new Date().toISOString().split('T')[0],
                lastLogin: new Date().toISOString()
            },
            {
                id: 2,
                username: 'violations_officer',