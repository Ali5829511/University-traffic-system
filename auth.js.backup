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
}

// إنشاء نسخة عامة من AuthManager
window.authManager = new AuthManager();

// تصدير الثوابت للاستخدام في صفحات أخرى
window.ROLES = ROLES;
window.PERMISSIONS = PERMISSIONS;
window.ROLE_NAMES = ROLE_NAMES;
