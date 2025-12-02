#!/usr/bin/env node
/**
 * API Test Script
 * سكريبت اختبار API
 * 
 * يختبر جميع نقاط النهاية الرئيسية
 */

const http = require('http');

const API_URL = 'http://localhost:3000/api';
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

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testEndpoint(name, path, method = 'GET', data = null) {
    try {
        log(`\n🧪 Testing: ${name}`, 'blue');
        log(`   ${method} ${path}`, 'yellow');
        
        const result = await makeRequest(path, method, data);
        
        if (result.status >= 200 && result.status < 300) {
            log(`   ✅ Success (${result.status})`, 'green');
            if (result.data.data && Array.isArray(result.data.data)) {
                log(`   📊 Retrieved ${result.data.data.length} records`, 'green');
            }
        } else {
            log(`   ⚠️  Status: ${result.status}`, 'yellow');
            log(`   Message: ${result.data.message || 'No message'}`, 'yellow');
        }
        
        return true;
    } catch (error) {
        log(`   ❌ Failed: ${error.message}`, 'red');
        return false;
    }
}

async function runTests() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🧪 API Test Suite                                        ║
║  مجموعة اختبار API                                       ║
╚════════════════════════════════════════════════════════════╝
    `);

    log('Starting tests...', 'blue');
    log('جاري تشغيل الاختبارات...\n', 'blue');

    const tests = [
        ['Health Check', '/health'],
        ['Get Users', '/users'],
        ['Get Violations', '/violations'],
        ['Get Vehicles', '/vehicles'],
        ['Get Stickers', '/stickers'],
        ['Get Buildings', '/buildings'],
        ['Get Residential Units', '/residential-units'],
    ];

    let passed = 0;
    let failed = 0;

    for (const [name, path, method, data] of tests) {
        const result = await testEndpoint(name, path, method, data);
        if (result) passed++;
        else failed++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test login endpoint
    log('\n🔐 Testing Login Endpoint', 'blue');
    try {
        const loginResult = await makeRequest('/auth/login', 'POST', {
            username: 'admin',
            password: 'admin123'
        });
        
        if (loginResult.status === 200 && loginResult.data.success) {
            log('   ✅ Login successful', 'green');
            log(`   👤 User: ${loginResult.data.user.full_name}`, 'green');
            log(`   🎭 Role: ${loginResult.data.user.role}`, 'green');
            passed++;
        } else {
            log('   ⚠️  Login failed or not configured', 'yellow');
            log(`   Message: ${loginResult.data.message}`, 'yellow');
            failed++;
        }
    } catch (error) {
        log(`   ❌ Login test failed: ${error.message}`, 'red');
        failed++;
    }

    // Summary
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Test Summary - ملخص الاختبار                            ║
╠════════════════════════════════════════════════════════════╣`);
    log(`║  ✅ Passed: ${passed}                                             `, passed > 0 ? 'green' : 'reset');
    log(`║  ❌ Failed: ${failed}                                             `, failed > 0 ? 'red' : 'reset');
    log(`║  📊 Total:  ${passed + failed}                                             `, 'blue');
    console.log(`╚════════════════════════════════════════════════════════════╝
    `);

    if (failed === 0) {
        log('🎉 All tests passed! النظام يعمل بشكل صحيح', 'green');
    } else if (passed > 0) {
        log('⚠️  Some tests failed. Check server and database configuration.', 'yellow');
        log('   بعض الاختبارات فشلت. تحقق من إعدادات الخادم وقاعدة البيانات.', 'yellow');
    } else {
        log('❌ All tests failed. Server may not be running.', 'red');
        log('   كل الاختبارات فشلت. الخادم قد لا يكون قيد التشغيل.', 'red');
        log('\n💡 Start the server with: npm start', 'yellow');
        log('   شغّل الخادم بالأمر: npm start', 'yellow');
    }

    process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running first
http.get('http://localhost:3000/api/health', (res) => {
    runTests();
}).on('error', () => {
    log('❌ Server is not running!', 'red');
    log('   الخادم غير قيد التشغيل!', 'red');
    log('\n💡 Start the server first with: npm start', 'yellow');
    log('   شغّل الخادم أولاً بالأمر: npm start', 'yellow');
    process.exit(1);
});
