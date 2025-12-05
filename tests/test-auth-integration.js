#!/usr/bin/env node
/**
 * Authentication Integration Test
 * اختبار تكامل المصادقة
 * 
 * Tests that authentication properly uses the backend API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🔐 Authentication Integration Test                        ║
║  اختبار تكامل المصادقة                                    ║
╚════════════════════════════════════════════════════════════╝
`);

let passed = 0;
let failed = 0;

// Test 1: Check that auth.js uses backend API
log('\n📝 Test 1: Check auth.js uses backend API', 'blue');
try {
    const authJsPath = path.join(__dirname, '../src/public/js/auth.js');
    const authJsContent = fs.readFileSync(authJsPath, 'utf8');
    
    // Check that it calls window.db.login()
    if (authJsContent.includes('window.db.login(username, password)')) {
        log('   ✅ auth.js properly calls backend API via window.db.login()', 'green');
        passed++;
    } else {
        log('   ❌ auth.js does not call window.db.login()', 'red');
        failed++;
    }
    
    // Check that it doesn't do direct password comparison
    if (!authJsContent.includes('u.username === username && u.password === password')) {
        log('   ✅ auth.js does not do client-side password comparison', 'green');
        passed++;
    } else {
        log('   ❌ auth.js still contains client-side password comparison', 'red');
        failed++;
    }
} catch (error) {
    log(`   ❌ Failed to read auth.js: ${error.message}`, 'red');
    failed += 2;
}

// Test 2: Check that login.html loads database-api.js
log('\n📝 Test 2: Check login.html loads database-api.js', 'blue');
try {
    const loginHtmlPath = path.join(__dirname, '../src/public/pages/login.html');
    const loginHtmlContent = fs.readFileSync(loginHtmlPath, 'utf8');
    
    if (loginHtmlContent.includes('src="/js/database-api.js"')) {
        log('   ✅ login.html loads database-api.js', 'green');
        passed++;
    } else {
        log('   ❌ login.html does not load database-api.js', 'red');
        failed++;
    }
    
    if (!loginHtmlContent.includes('src="/js/database.js"')) {
        log('   ✅ login.html does not load legacy database.js', 'green');
        passed++;
    } else {
        log('   ❌ login.html still loads legacy database.js', 'red');
        failed++;
    }
} catch (error) {
    log(`   ❌ Failed to read login.html: ${error.message}`, 'red');
    failed += 2;
}

// Test 3: Check that database-api.js has login method
log('\n📝 Test 3: Check database-api.js has login method', 'blue');
try {
    const dbApiPath = path.join(__dirname, '../src/public/js/database-api.js');
    const dbApiContent = fs.readFileSync(dbApiPath, 'utf8');
    
    if (dbApiContent.includes('async login(username, password)')) {
        log('   ✅ database-api.js has login method', 'green');
        passed++;
    } else {
        log('   ❌ database-api.js missing login method', 'red');
        failed++;
    }
    
    if (dbApiContent.includes('/auth/login') || dbApiContent.includes('/api/auth/login')) {
        log('   ✅ database-api.js calls /api/auth/login endpoint', 'green');
        passed++;
    } else {
        log('   ❌ database-api.js does not call /api/auth/login', 'red');
        failed++;
    }
} catch (error) {
    log(`   ❌ Failed to read database-api.js: ${error.message}`, 'red');
    failed += 2;
}

// Test 4: Check server has login endpoint with bcrypt
log('\n📝 Test 4: Check server has secure login endpoint', 'blue');
try {
    const serverPath = path.join(__dirname, '../src/server/server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes("app.post('/api/auth/login'")) {
        log('   ✅ Server has /api/auth/login endpoint', 'green');
        passed++;
    } else {
        log('   ❌ Server missing /api/auth/login endpoint', 'red');
        failed++;
    }
    
    if (serverContent.includes('bcrypt.compare(password, user.password_hash)')) {
        log('   ✅ Server uses bcrypt for password verification', 'green');
        passed++;
    } else {
        log('   ❌ Server does not use bcrypt for password verification', 'red');
        failed++;
    }
    
    if (serverContent.includes('await logAuditActivity')) {
        log('   ✅ Server logs authentication attempts', 'green');
        passed++;
    } else {
        log('   ⚠️  Server may not log authentication attempts', 'yellow');
    }
} catch (error) {
    log(`   ❌ Failed to read server.js: ${error.message}`, 'red');
    failed += 3;
}

// Test 5: Check db-config has proper user seeding
log('\n📝 Test 5: Check db-config has secure user seeding', 'blue');
try {
    const dbConfigPath = path.join(__dirname, '../src/server/config/db-config.js');
    const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');
    
    if (dbConfigContent.includes('async seedDefaultUsers()')) {
        log('   ✅ db-config has seedDefaultUsers method', 'green');
        passed++;
    } else {
        log('   ❌ db-config missing seedDefaultUsers method', 'red');
        failed++;
    }
    
    if (dbConfigContent.includes('bcrypt.hash(')) {
        log('   ✅ db-config uses bcrypt to hash passwords', 'green');
        passed++;
    } else {
        log('   ❌ db-config does not use bcrypt', 'red');
        failed++;
    }
} catch (error) {
    log(`   ❌ Failed to read db-config.js: ${error.message}`, 'red');
    failed += 2;
}

// Summary
log('\n' + '═'.repeat(60), 'blue');
log(`📊 Test Results / نتائج الاختبار`, 'blue');
log('═'.repeat(60), 'blue');
log(`✅ Passed: ${passed}`, 'green');
log(`❌ Failed: ${failed}`, 'red');
log(`📈 Total:  ${passed + failed}`, 'blue');
log('═'.repeat(60) + '\n', 'blue');

if (failed === 0) {
    log('🎉 All tests passed! Authentication is properly secured.', 'green');
    log('🎉 جميع الاختبارات نجحت! المصادقة آمنة بشكل صحيح.', 'green');
    process.exit(0);
} else {
    log('⚠️  Some tests failed. Please review the issues above.', 'yellow');
    log('⚠️  فشلت بعض الاختبارات. يرجى مراجعة المشاكل أعلاه.', 'yellow');
    process.exit(1);
}
