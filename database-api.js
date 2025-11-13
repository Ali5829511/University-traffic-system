/**
 * نظام إدارة قاعدة البيانات - الإصدار السحابي
 * Cloud Database Management System
 * @version 2.0.0
 * 
 * هذا الإصدار يتصل بقاعدة بيانات سحابية حقيقية عبر API
 * This version connects to a real cloud database via API
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'TrafficSystemDB';
        this.version = 2;
        this.dbType = 'cloud'; // نوع قاعدة البيانات
        this.connectionStatus = 'connecting'; // حالة الاتصال
        this.apiUrl = this.getApiUrl();
        this.init();
    }

    /**
     * الحصول على عنوان API
     */
    getApiUrl() {
        // في حالة التطوير المحلي
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        // في حالة الإنتاج، استخدم نفس النطاق
        return '/api';
    }

    /**
     * تهيئة قاعدة البيانات
     */
    async init() {
        try {
            // اختبار الاتصال بالخادم
            const response = await fetch(`${this.apiUrl}/health`);
            
            if (response.ok) {
                this.connectionStatus = 'connected';
                console.log('✓ قاعدة البيانات السحابية متصلة بنجاح');
            } else {
                this.connectionStatus = 'error';
                console.error('✗ فشل الاتصال بقاعدة البيانات السحابية');
                this.fallbackToLocalStorage();
            }
        } catch (error) {
            console.error('خطأ في الاتصال بقاعدة البيانات:', error);
            this.connectionStatus = 'error';
            this.fallbackToLocalStorage();
        }
    }

    /**
     * الرجوع إلى localStorage في حالة فشل الاتصال
     */
    fallbackToLocalStorage() {
        console.warn('⚠️ التحويل إلى التخزين المحلي (localStorage)');
        this.dbType = 'localStorage';
        
        // تحميل نظام localStorage القديم
        if (typeof window.dbLegacy === 'undefined') {
            const script = document.createElement('script');
            script.src = 'database.js';
            document.head.appendChild(script);
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
            isConnected: this.connectionStatus === 'connected',
            apiUrl: this.apiUrl
        };
    }

    /**
     * الحصول على المستخدمين
     */
    async getUsers() {
        try {
            if (this.dbType === 'localStorage') {
                return this.getFromLocalStorage('users');
            }

            const response = await fetch(`${this.apiUrl}/users`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
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
            if (this.dbType === 'localStorage') {
                const users = this.getFromLocalStorage('users');
                const userIndex = users.findIndex(u => u.id === userId);
                
                if (userIndex !== -1) {
                    users[userIndex].lastLogin = new Date().toISOString();
                    localStorage.setItem('users', JSON.stringify(users));
                    return true;
                }
                return false;
            }

            // في حالة قاعدة البيانات السحابية، يتم التحديث تلقائياً عند تسجيل الدخول
            return true;
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
            if (this.dbType === 'localStorage') {
                return this.getFromLocalStorage('violations');
            }

            const response = await fetch(`${this.apiUrl}/violations`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
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
            if (this.dbType === 'localStorage') {
                const violations = this.getFromLocalStorage('violations');
                violation.id = Date.now();
                violations.push(violation);
                localStorage.setItem('violations', JSON.stringify(violations));
                return { success: true, id: violation.id };
            }

            const response = await fetch(`${this.apiUrl}/violations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(violation)
            });

            const data = await response.json();
            return data;
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
            if (this.dbType === 'localStorage') {
                return this.getFromLocalStorage('stickers');
            }

            const response = await fetch(`${this.apiUrl}/stickers`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
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
            if (this.dbType === 'localStorage') {
                const stickers = this.getFromLocalStorage('stickers');
                sticker.id = Date.now();
                stickers.push(sticker);
                localStorage.setItem('stickers', JSON.stringify(stickers));
                return { success: true, id: sticker.id };
            }

            const response = await fetch(`${this.apiUrl}/stickers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sticker)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('خطأ في إضافة الملصق:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على المباني
     */
    async getBuildings() {
        try {
            if (this.dbType === 'localStorage') {
                return this.getFromLocalStorage('buildings') || [];
            }

            const response = await fetch(`${this.apiUrl}/buildings`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطأ في جلب المباني:', error);
            return [];
        }
    }

    /**
     * الحصول على الوحدات السكنية
     */
    async getResidentialUnits() {
        try {
            if (this.dbType === 'localStorage') {
                return this.getFromLocalStorage('residential_units') || [];
            }

            const response = await fetch(`${this.apiUrl}/residential-units`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطأ في جلب الوحدات السكنية:', error);
            return [];
        }
    }

    /**
     * الحصول على السيارات
     */
    async getVehicles() {
        try {
            if (this.dbType === 'localStorage') {
                return this.getFromLocalStorage('vehicles') || [];
            }

            const response = await fetch(`${this.apiUrl}/vehicles`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('خطأ في جلب السيارات:', error);
            return [];
        }
    }

    /**
     * الحصول من localStorage (للوضع الاحتياطي)
     */
    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`خطأ في جلب ${key} من localStorage:`, error);
            return [];
        }
    }

    /**
     * تسجيل الدخول
     */
    async login(username, password) {
        try {
            if (this.dbType === 'localStorage') {
                // استخدام نظام المصادقة المحلي
                if (typeof window.auth !== 'undefined') {
                    return window.auth.login(username, password);
                }
                return { success: false, message: 'نظام المصادقة غير متوفر' };
            }

            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }
}

// إنشاء نسخة عامة من DatabaseManager
window.db = new DatabaseManager();
