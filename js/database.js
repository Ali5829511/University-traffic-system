/**
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

            // إنشاء جدول السيارات المحجوزة إذا لم يكن موجوداً
            if (!localStorage.getItem('seizedVehicles')) {
                this.initializeSeizedVehicles();
            }

            // إنشاء جدول الحوادث المرورية إذا لم يكن موجوداً
            if (!localStorage.getItem('trafficAccidents')) {
                this.initializeTrafficAccidents();
            }

            // تحديث حالة الاتصال
            this.connectionStatus = 'connected';
            console.log('✓ قاعدة البيانات متصلة بنجاح (localStorage)');
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
                password: 'admin123',
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
                password: 'officer123',
                name: 'مسجل المخالفات',
                email: 'violations@university.edu.sa',
                role: 'violations_officer',
                status: 'active',
                createdDate: new Date().toISOString().split('T')[0],
                lastLogin: null
            },
            {
                id: 3,
                username: 'inquiry_user',
                password: 'inquiry123',
                name: 'موظف الاستعلام',
                email: 'inquiry@university.edu.sa',
                role: 'inquiry_user',
                status: 'active',
                createdDate: new Date().toISOString().split('T')[0],
                lastLogin: null
            }
        ];

        localStorage.setItem('users', JSON.stringify(defaultUsers));
        console.log('✓ تم إنشاء المستخدمين الافتراضيين');
    }

    /**
     * إنشاء الملصقات الافتراضية
     */
    initializeDefaultStickers() {
        const defaultStickers = [];
        localStorage.setItem('stickers', JSON.stringify(defaultStickers));
        console.log('✓ تم إنشاء جدول الملصقات');
    }

    /**
     * إنشاء السيارات المحجوزة الافتراضية
     */
    initializeSeizedVehicles() {
        const defaultSeizedVehicles = [];
        localStorage.setItem('seizedVehicles', JSON.stringify(defaultSeizedVehicles));
        console.log('✓ تم إنشاء جدول السيارات المحجوزة');
    }

    /**
     * إنشاء الحوادث المرورية الافتراضية
     */
    initializeTrafficAccidents() {
        const defaultAccidents = [];
        localStorage.setItem('trafficAccidents', JSON.stringify(defaultAccidents));
        console.log('✓ تم إنشاء جدول الحوادث المرورية');
    }

    /**
     * الحصول على المستخدمين
     */
    async getUsers() {
        try {
            const users = localStorage.getItem('users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('خطأ في جلب المستخدمين:', error);
            return [];
        }
    }

    /**
     * تحديث آخر تسجيل دخول
     */
    async updateLastLogin(userId) {
        try {
            const users = await this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                users[userIndex].lastLogin = new Date().toISOString();
                localStorage.setItem('users', JSON.stringify(users));
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطأ في تحديث آخر تسجيل دخول:', error);
            return false;
        }
    }

    /**
     * الحصول على المخالفات
     */
    async getViolations() {
        try {
            const violations = localStorage.getItem('violations');
            return violations ? JSON.parse(violations) : [];
        } catch (error) {
            console.error('خطأ في جلب المخالفات:', error);
            return [];
        }
    }

    /**
     * إضافة مخالفة
     */
    async addViolation(violation) {
        try {
            const violations = await this.getViolations();
            violation.id = Date.now();
            violations.push(violation);
            localStorage.setItem('violations', JSON.stringify(violations));
            return { success: true, id: violation.id };
        } catch (error) {
            console.error('خطأ في إضافة المخالفة:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على الملصقات
     */
    async getStickers() {
        try {
            const stickers = localStorage.getItem('stickers');
            return stickers ? JSON.parse(stickers) : [];
        } catch (error) {
            console.error('خطأ في جلب الملصقات:', error);
            return [];
        }
    }

    /**
     * إضافة ملصق
     */
    async addSticker(sticker) {
        try {
            const stickers = await this.getStickers();
            sticker.id = Date.now();
            stickers.push(sticker);
            localStorage.setItem('stickers', JSON.stringify(stickers));
            return { success: true, id: sticker.id };
        } catch (error) {
            console.error('خطأ في إضافة الملصق:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على السيارات المحجوزة
     */
    async getSeizedVehicles() {
        try {
            const seizedVehicles = localStorage.getItem('seizedVehicles');
            return seizedVehicles ? JSON.parse(seizedVehicles) : [];
        } catch (error) {
            console.error('خطأ في جلب السيارات المحجوزة:', error);
            return [];
        }
    }

    /**
     * إضافة سيارة محجوزة
     */
    async addSeizedVehicle(vehicle) {
        try {
            const seizedVehicles = await this.getSeizedVehicles();
            vehicle.id = Date.now();
            vehicle.seizedDate = vehicle.seizedDate || new Date().toISOString();
            seizedVehicles.push(vehicle);
            localStorage.setItem('seizedVehicles', JSON.stringify(seizedVehicles));
            return { success: true, id: vehicle.id };
        } catch (error) {
            console.error('خطأ في إضافة السيارة المحجوزة:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على الحوادث المرورية
     */
    async getTrafficAccidents() {
        try {
            const accidents = localStorage.getItem('trafficAccidents');
            return accidents ? JSON.parse(accidents) : [];
        } catch (error) {
            console.error('خطأ في جلب الحوادث المرورية:', error);
            return [];
        }
    }

    /**
     * إضافة حادث مروري
     */
    async addTrafficAccident(accident) {
        try {
            const accidents = await this.getTrafficAccidents();
            accident.id = Date.now();
            accident.dateTime = accident.dateTime || new Date().toISOString();
            accident.status = accident.status || 'active';
            accidents.push(accident);
            localStorage.setItem('trafficAccidents', JSON.stringify(accidents));
            return { success: true, id: accident.id };
        } catch (error) {
            console.error('خطأ في إضافة الحادث المروري:', error);
            return { success: false, error: error.message };
        }
    }
}

// إنشاء نسخة عامة من DatabaseManager
window.db = new DatabaseManager();
