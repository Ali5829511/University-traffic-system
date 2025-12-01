/**
 * نظام إدارة مواقف السيارات والمخالفات
 * Parking and Violations Management System
 * @version 1.0.0
 */

(function() {
    'use strict';

    // App Configuration
    const APP_CONFIG = {
        name: 'نظام إدارة مواقف السيارات والمخالفات',
        version: '1.0.0',
        apiBaseUrl: '/api',
        storagePrefix: 'parking_system_',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
    };

    // State Management
    const AppState = {
        user: null,
        isAuthenticated: false,
        currentPage: 'dashboard',
        loading: false,
        notifications: [],
    };

    // DOM Utilities
    const DOM = {
        root: document.getElementById('root'),
        
        // Sanitize HTML to prevent XSS attacks
        sanitizeHTML(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        createElement(tag, attrs = {}, children = []) {
            const element = document.createElement(tag);
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    // Note: innerHTML is used for trusted template content only
                    // User-generated content should use textContent instead
                    element.innerHTML = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key.startsWith('on')) {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    element.setAttribute(key, value);
                }
            });
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
            return element;
        },

        clear() {
            this.root.innerHTML = '';
        },

        render(content) {
            this.clear();
            if (typeof content === 'string') {
                // Template content - considered trusted
                this.root.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.root.appendChild(content);
            }
        }
    };

    // Storage Utilities
    const Storage = {
        get(key) {
            try {
                const value = localStorage.getItem(APP_CONFIG.storagePrefix + key);
                return value ? JSON.parse(value) : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(APP_CONFIG.storagePrefix + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(APP_CONFIG.storagePrefix + key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },

        clear() {
            try {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(APP_CONFIG.storagePrefix))
                    .forEach(key => localStorage.removeItem(key));
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    };

    // Authentication Module
    const Auth = {
        checkSession() {
            const session = Storage.get('session');
            if (session && session.expiresAt > Date.now()) {
                AppState.user = session.user;
                AppState.isAuthenticated = true;
                return true;
            }
            this.logout();
            return false;
        },

        login(username, password) {
            // Demo users for development/testing only
            // WARNING: In production, use a secure authentication service with hashed passwords
            // These credentials should be replaced with environment-based configuration
            const users = {
                'admin': { id: 1, name: 'مدير النظام', role: 'admin', password: 'admin123' },
                'parking_officer': { id: 2, name: 'موظف المواقف', role: 'parking', password: 'parking123' },
                'violations_officer': { id: 3, name: 'موظف المخالفات', role: 'violations', password: 'violations123' }
            };
            
            // TODO: Replace with API call to secure backend authentication
            // Example: return await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

            const user = users[username];
            if (user && user.password === password) {
                const session = {
                    user: { id: user.id, name: user.name, role: user.role, username },
                    expiresAt: Date.now() + APP_CONFIG.sessionTimeout
                };
                Storage.set('session', session);
                AppState.user = session.user;
                AppState.isAuthenticated = true;
                return { success: true, user: session.user };
            }
            return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        },

        logout() {
            Storage.remove('session');
            AppState.user = null;
            AppState.isAuthenticated = false;
            Router.navigate('login');
        },

        hasPermission(permission) {
            if (!AppState.user) return false;
            const permissions = {
                admin: ['all'],
                parking: ['parking', 'view'],
                violations: ['violations', 'view']
            };
            const userPerms = permissions[AppState.user.role] || [];
            return userPerms.includes('all') || userPerms.includes(permission);
        }
    };

    // Router Module
    const Router = {
        routes: {},
        currentRoute: null,

        register(path, handler) {
            this.routes[path] = handler;
        },

        navigate(path, params = {}) {
            if (path !== 'login' && !Auth.checkSession()) {
                this.navigate('login');
                return;
            }
            
            const handler = this.routes[path];
            if (handler) {
                this.currentRoute = path;
                AppState.currentPage = path;
                handler(params);
                window.history.pushState({ path, params }, '', `#${path}`);
            } else {
                console.warn('Route not found:', path);
                this.navigate('dashboard');
            }
        },

        init() {
            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.path) {
                    this.navigate(e.state.path, e.state.params);
                }
            });

            const hash = window.location.hash.slice(1) || 'login';
            this.navigate(hash);
        }
    };

    // UI Components
    const Components = {
        // Loading Spinner
        loading() {
            return `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
        },

        // Alert Component
        alert(type, message) {
            return `
                <div class="alert alert-${type}">
                    ${message}
                </div>
            `;
        },

        // Header Component
        header() {
            const user = AppState.user || { name: 'زائر' };
            return `
                <nav class="navbar">
                    <div class="container flex items-center justify-between">
                        <div class="navbar-brand">${APP_CONFIG.name}</div>
                        <div class="flex items-center gap-md">
                            <span class="text-white">مرحباً، ${user.name}</span>
                            ${AppState.isAuthenticated ? `
                                <button class="btn btn-secondary" onclick="App.logout()">
                                    تسجيل الخروج
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </nav>
            `;
        },

        // Sidebar Component
        sidebar() {
            const menuItems = [
                { path: 'dashboard', icon: '📊', label: 'لوحة التحكم', permission: 'view' },
                { path: 'parking', icon: '🅿️', label: 'إدارة المواقف', permission: 'parking' },
                { path: 'violations', icon: '⚠️', label: 'المخالفات', permission: 'violations' },
                { path: 'vehicles', icon: '🚗', label: 'المركبات', permission: 'view' },
                { path: 'reports', icon: '📋', label: 'التقارير', permission: 'view' },
                { path: 'settings', icon: '⚙️', label: 'الإعدادات', permission: 'admin' },
            ];

            return `
                <aside class="sidebar">
                    <div class="mb-lg">
                        <h3 class="text-white">${APP_CONFIG.name}</h3>
                    </div>
                    <nav>
                        <ul style="list-style: none;">
                            ${menuItems
                                .filter(item => Auth.hasPermission(item.permission))
                                .map(item => `
                                    <li style="margin-bottom: 0.5rem;">
                                        <a href="#${item.path}" 
                                           class="nav-link ${AppState.currentPage === item.path ? 'active' : ''}"
                                           onclick="App.navigate('${item.path}'); return false;">
                                            <span style="margin-left: 0.5rem;">${item.icon}</span>
                                            ${item.label}
                                        </a>
                                    </li>
                                `).join('')}
                        </ul>
                    </nav>
                </aside>
            `;
        },

        // Stats Card
        statCard(icon, value, label, color = 'blue') {
            return `
                <div class="stat-card">
                    <div class="stat-icon ${color}">${icon}</div>
                    <div>
                        <div class="stat-value">${value}</div>
                        <div class="stat-label">${label}</div>
                    </div>
                </div>
            `;
        }
    };

    // Pages
    const Pages = {
        // Login Page
        login() {
            DOM.render(`
                <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);">
                    <div class="card" style="width: 100%; max-width: 400px; margin: 1rem;">
                        <div class="card-body">
                            <div class="text-center mb-lg">
                                <h2>${APP_CONFIG.name}</h2>
                                <p class="text-secondary">تسجيل الدخول</p>
                            </div>
                            <div id="loginError"></div>
                            <form id="loginForm">
                                <div class="form-group">
                                    <label class="form-label">اسم المستخدم</label>
                                    <input type="text" id="username" class="form-control" placeholder="أدخل اسم المستخدم" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">كلمة المرور</label>
                                    <input type="password" id="password" class="form-control" placeholder="أدخل كلمة المرور" required>
                                </div>
                                <button type="submit" class="btn btn-primary" style="width: 100%;">
                                    تسجيل الدخول
                                </button>
                            </form>
                            <div class="mt-lg text-center">
                                <p class="text-secondary" style="font-size: 0.875rem;">
                                    للتجربة: admin / admin123
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            document.getElementById('loginForm').addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const result = Auth.login(username, password);
                
                if (result.success) {
                    Router.navigate('dashboard');
                } else {
                    document.getElementById('loginError').innerHTML = Components.alert('error', result.error);
                }
            });
        },

        // Dashboard Page
        dashboard() {
            const stats = {
                totalParkingSpots: 150,
                occupiedSpots: 87,
                todayViolations: 12,
                registeredVehicles: 234
            };

            DOM.render(`
                ${Components.header()}
                <div class="dashboard">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <h2 class="mb-lg">لوحة التحكم</h2>
                        
                        <div class="stats-grid">
                            ${Components.statCard('🅿️', stats.totalParkingSpots, 'إجمالي مواقف السيارات', 'blue')}
                            ${Components.statCard('🚗', stats.occupiedSpots, 'المواقف المشغولة', 'green')}
                            ${Components.statCard('⚠️', stats.todayViolations, 'مخالفات اليوم', 'yellow')}
                            ${Components.statCard('📋', stats.registeredVehicles, 'المركبات المسجلة', 'red')}
                        </div>

                        <div class="grid grid-cols-2">
                            <div class="card">
                                <div class="card-header">
                                    <h3>آخر المخالفات</h3>
                                </div>
                                <div class="card-body">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>رقم اللوحة</th>
                                                <th>نوع المخالفة</th>
                                                <th>التاريخ</th>
                                                <th>الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>أ ب ج 1234</td>
                                                <td>وقوف في منطقة محظورة</td>
                                                <td>2025-11-25</td>
                                                <td><span class="badge badge-warning">قيد المعالجة</span></td>
                                            </tr>
                                            <tr>
                                                <td>س ص ع 5678</td>
                                                <td>تجاوز المدة المسموحة</td>
                                                <td>2025-11-25</td>
                                                <td><span class="badge badge-success">مسددة</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="card">
                                <div class="card-header">
                                    <h3>نظرة سريعة</h3>
                                </div>
                                <div class="card-body">
                                    <div class="mb-md">
                                        <div class="flex justify-between mb-sm">
                                            <span>نسبة الإشغال</span>
                                            <span>${Math.round((stats.occupiedSpots / stats.totalParkingSpots) * 100)}%</span>
                                        </div>
                                        <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden;">
                                            <div style="background: var(--accent-color); height: 100%; width: ${(stats.occupiedSpots / stats.totalParkingSpots) * 100}%;"></div>
                                        </div>
                                    </div>
                                    <div class="flex gap-md mt-lg">
                                        <button class="btn btn-primary" onclick="App.navigate('parking')">
                                            إدارة المواقف
                                        </button>
                                        <button class="btn btn-secondary" onclick="App.navigate('violations')">
                                            عرض المخالفات
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `);
        },

        // Parking Management Page
        parking() {
            DOM.render(`
                ${Components.header()}
                <div class="dashboard">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <div class="flex justify-between items-center mb-lg">
                            <h2>إدارة المواقف</h2>
                            <button class="btn btn-primary">+ إضافة موقف جديد</button>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>رقم الموقف</th>
                                            <th>الموقع</th>
                                            <th>الحالة</th>
                                            <th>رقم المركبة</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>A-001</td>
                                            <td>المبنى الرئيسي - الطابق الأرضي</td>
                                            <td><span class="badge badge-success">متاح</span></td>
                                            <td>-</td>
                                            <td>
                                                <button class="btn btn-secondary">تعديل</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>A-002</td>
                                            <td>المبنى الرئيسي - الطابق الأرضي</td>
                                            <td><span class="badge badge-error">مشغول</span></td>
                                            <td>أ ب ج 1234</td>
                                            <td>
                                                <button class="btn btn-secondary">تعديل</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>B-001</td>
                                            <td>المبنى الفرعي - الطابق الأول</td>
                                            <td><span class="badge badge-warning">محجوز</span></td>
                                            <td>خ د ه 9012</td>
                                            <td>
                                                <button class="btn btn-secondary">تعديل</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            `);
        },

        // Violations Page
        violations() {
            DOM.render(`
                ${Components.header()}
                <div class="dashboard">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <div class="flex justify-between items-center mb-lg">
                            <h2>المخالفات</h2>
                            <button class="btn btn-primary">+ تسجيل مخالفة جديدة</button>
                        </div>
                        
                        <div class="card mb-lg">
                            <div class="card-body">
                                <div class="grid grid-cols-4">
                                    <div class="form-group">
                                        <label class="form-label">بحث برقم اللوحة</label>
                                        <input type="text" class="form-control" placeholder="رقم اللوحة">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">نوع المخالفة</label>
                                        <select class="form-control">
                                            <option value="">الكل</option>
                                            <option value="parking">وقوف خاطئ</option>
                                            <option value="time">تجاوز المدة</option>
                                            <option value="zone">منطقة محظورة</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">الحالة</label>
                                        <select class="form-control">
                                            <option value="">الكل</option>
                                            <option value="pending">قيد المعالجة</option>
                                            <option value="paid">مسددة</option>
                                            <option value="cancelled">ملغاة</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">&nbsp;</label>
                                        <button class="btn btn-primary" style="width: 100%;">بحث</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>رقم المخالفة</th>
                                            <th>رقم اللوحة</th>
                                            <th>نوع المخالفة</th>
                                            <th>المبلغ</th>
                                            <th>التاريخ</th>
                                            <th>الحالة</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>VIO-001</td>
                                            <td>أ ب ج 1234</td>
                                            <td>وقوف في منطقة محظورة</td>
                                            <td>150 ر.س</td>
                                            <td>2025-11-25</td>
                                            <td><span class="badge badge-warning">قيد المعالجة</span></td>
                                            <td>
                                                <button class="btn btn-secondary">عرض</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>VIO-002</td>
                                            <td>س ص ع 5678</td>
                                            <td>تجاوز المدة المسموحة</td>
                                            <td>100 ر.س</td>
                                            <td>2025-11-25</td>
                                            <td><span class="badge badge-success">مسددة</span></td>
                                            <td>
                                                <button class="btn btn-secondary">عرض</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            `);
        },

        // Vehicles Page
        vehicles() {
            DOM.render(`
                ${Components.header()}
                <div class="dashboard">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <div class="flex justify-between items-center mb-lg">
                            <h2>المركبات المسجلة</h2>
                            <button class="btn btn-primary">+ تسجيل مركبة جديدة</button>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>رقم اللوحة</th>
                                            <th>نوع المركبة</th>
                                            <th>اللون</th>
                                            <th>المالك</th>
                                            <th>تاريخ التسجيل</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>أ ب ج 1234</td>
                                            <td>تويوتا كامري</td>
                                            <td>أبيض</td>
                                            <td>أحمد محمد</td>
                                            <td>2025-01-15</td>
                                            <td>
                                                <button class="btn btn-secondary">تعديل</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>س ص ع 5678</td>
                                            <td>هوندا أكورد</td>
                                            <td>رمادي</td>
                                            <td>خالد علي</td>
                                            <td>2025-02-20</td>
                                            <td>
                                                <button class="btn btn-secondary">تعديل</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            `);
        },

        // Reports Page
        reports() {
            DOM.render(`
                ${Components.header()}
                <div class="dashboard">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <h2 class="mb-lg">التقارير</h2>
                        
                        <div class="grid grid-cols-3">
                            <div class="card">
                                <div class="card-body text-center">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                                    <h4>تقرير المخالفات</h4>
                                    <p class="text-secondary">تقرير شامل عن المخالفات المسجلة</p>
                                    <button class="btn btn-primary mt-md">عرض التقرير</button>
                                </div>
                            </div>
                            <div class="card">
                                <div class="card-body text-center">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">🅿️</div>
                                    <h4>تقرير المواقف</h4>
                                    <p class="text-secondary">تقرير عن استخدام المواقف</p>
                                    <button class="btn btn-primary mt-md">عرض التقرير</button>
                                </div>
                            </div>
                            <div class="card">
                                <div class="card-body text-center">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
                                    <h4>التقرير المالي</h4>
                                    <p class="text-secondary">تقرير عن الإيرادات والمدفوعات</p>
                                    <button class="btn btn-primary mt-md">عرض التقرير</button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `);
        },

        // Settings Page
        settings() {
            DOM.render(`
                ${Components.header()}
                <div class="dashboard">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <h2 class="mb-lg">الإعدادات</h2>
                        
                        <div class="grid grid-cols-2">
                            <div class="card">
                                <div class="card-header">
                                    <h3>إعدادات النظام</h3>
                                </div>
                                <div class="card-body">
                                    <div class="form-group">
                                        <label class="form-label">اسم المؤسسة</label>
                                        <input type="text" class="form-control" value="جامعة الإمام محمد بن سعود الإسلامية">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">البريد الإلكتروني</label>
                                        <input type="email" class="form-control" value="parking@example.com">
                                    </div>
                                    <button class="btn btn-primary">حفظ الإعدادات</button>
                                </div>
                            </div>

                            <div class="card">
                                <div class="card-header">
                                    <h3>إعدادات المخالفات</h3>
                                </div>
                                <div class="card-body">
                                    <div class="form-group">
                                        <label class="form-label">قيمة مخالفة الوقوف الخاطئ (ر.س)</label>
                                        <input type="number" class="form-control" value="150">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">قيمة مخالفة تجاوز المدة (ر.س)</label>
                                        <input type="number" class="form-control" value="100">
                                    </div>
                                    <button class="btn btn-primary">حفظ الإعدادات</button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `);
        }
    };

    // App Initialization
    const App = {
        init() {
            // Register routes
            Router.register('login', Pages.login);
            Router.register('dashboard', Pages.dashboard);
            Router.register('parking', Pages.parking);
            Router.register('violations', Pages.violations);
            Router.register('vehicles', Pages.vehicles);
            Router.register('reports', Pages.reports);
            Router.register('settings', Pages.settings);

            // Initialize router
            Router.init();
        },

        navigate(path) {
            Router.navigate(path);
        },

        logout() {
            Auth.logout();
        }
    };

    // Make App globally accessible
    window.App = App;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
})();
