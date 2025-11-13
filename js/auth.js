/**
 * نظام إدارة المصادقة والصلاحيات
 * Authentication & Authorization Manager
 * @version 1.0.0
 */

// تعريف الأدوار
const ROLES = {
    ADMIN: 'admin',
    VIOLATIONS_OFFICER: 'violations_officer',
    INQUIRY_USER: 'inquiry_user',
    MANAGER: 'manager',
    VIOLATION_ENTRY: 'violation_entry'
};

// أسماء الأدوار بالعربية
const ROLE_NAMES = {
    'admin': 'مدير النظام',
    'violations_officer': 'مسجل المخالفات',
    'inquiry_user': 'موظف الاستعلام',
    'manager': 'المدير',
    'violation_entry': 'إدخال المخالفات'
};

// الصلاحيات لكل دور
const PERMISSIONS = {
    'admin': {
        canViewAll: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
        canViewReports: true,
        canExport: true
    },
    'violations_officer': {
        canViewAll: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canManageUsers: false,
        canViewReports: true,
        canExport: true
    },
    'inquiry_user': {
        canViewAll: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canViewReports: true,
        canExport: false
    },
    'manager': {
        canViewAll: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: false,
        canViewReports: true,
        canExport: true
    },
    'violation_entry': {
        canViewAll: false,
        canAdd: true,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canViewReports: false,
        canExport: false
    }
};

/**
 * مدير المصادقة
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
        this.lastActivity = Date.now();
        this.init();
    }

    /**
     * تهيئة نظام المصادقة
     */
    init() {
        // استعادة الجلسة من localStorage
        const session = localStorage.getItem('userSession');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = Date.now();
                
                // التحقق من صلاحية الجلسة
                if (sessionData.timestamp && (now - sessionData.timestamp < this.sessionTimeout)) {
                    this.currentUser = sessionData.user;
                    this.lastActivity = sessionData.timestamp;
                } else {
                    // انتهت صلاحية الجلسة
                    this.logout();
                }
            } catch (error) {
                console.error('خطأ في استعادة الجلسة:', error);
                this.logout();
            }
        }
        
        // إضافة مستمعين للنشاط
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), true);
        });
        
        // التحقق من انتهاء الجلسة كل دقيقة
        setInterval(() => {
            if (this.currentUser) {
                const now = Date.now();
                if (now - this.lastActivity > this.sessionTimeout) {
                    alert('انتهت مدة الجلسة. يرجى تسجيل الدخول مرة أخرى.');
                    this.logout();
                }
            }
        }, 60000); // كل دقيقة
    }

    /**
     * تحديث وقت النشاط
     */
    updateActivity() {
        this.lastActivity = Date.now();
        if (this.currentUser) {
            this.saveSession();
        }
    }

    /**
     * الحصول على اسم الدور بالعربية
     */
    getRoleName(role) {
        return ROLE_NAMES[role] || role;
    }

    /**
     * الحصول على جميع الصلاحيات للدور الحالي
     */
    getAllPermissions() {
        if (!this.currentUser) {
            return {};
        }
        return PERMISSIONS[this.currentUser.role] || {};
    }

    /**
     * تسجيل الدخول
     */
    async login(username, password) {
        try {
            // الحصول على المستخدمين من قاعدة البيانات
            const users = window.db ? await window.db.getUsers() : JSON.parse(localStorage.getItem('users') || '[]');
            
            // البحث عن المستخدم
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                // تسجيل دخول ناجح
                this.currentUser = {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                };
                
                this.lastActivity = Date.now();
                this.saveSession();
                
                return {
                    success: true,
                    user: this.currentUser,
                    message: 'تم تسجيل الدخول بنجاح',
                    message_ar: 'جاري التحويل إلى لوحة التحكم...'
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid credentials',
                    error_ar: 'اسم المستخدم أو كلمة المرور غير صحيحة'
                };
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            return {
                success: false,
                error: 'Login failed',
                error_ar: 'حدث خطأ أثناء تسجيل الدخول'
            };
        }
    }

    /**
     * حفظ الجلسة
     */
    saveSession() {
        const session = {
            user: this.currentUser,
            timestamp: this.lastActivity
        };
        localStorage.setItem('userSession', JSON.stringify(session));
    }

    /**
     * تسجيل الخروج
     */
    logout() {
        this.currentUser = null;
        this.lastActivity = 0;
        localStorage.removeItem('userSession');
        window.location.href = 'index.html';
    }

    /**
     * التحقق من المصادقة
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * الحصول على المستخدم الحالي
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * التحقق من الصلاحية
     */
    hasPermission(permission) {
        if (!this.currentUser) {
            return false;
        }
        const permissions = PERMISSIONS[this.currentUser.role] || {};
        return permissions[permission] === true;
    }

    /**
     * التحقق من الدور
     */
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    /**
     * التوجيه إلى الصفحة الافتراضية
     */
    redirectToDefaultPage() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // التوجيه حسب الدور
        switch (this.currentUser.role) {
            case ROLES.VIOLATION_ENTRY:
                window.location.href = 'traffic_dashboard.html';
                break;
            default:
                window.location.href = 'home.html';
                break;
        }
    }
}

// إنشاء نسخة عامة من AuthManager
window.authManager = new AuthManager();

// تصدير الثوابت للاستخدام في صفحات أخرى
window.ROLES = ROLES;
window.PERMISSIONS = PERMISSIONS;
window.ROLE_NAMES = ROLE_NAMES;
