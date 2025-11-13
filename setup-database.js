#!/usr/bin/env node
/**
 * Database Setup Script
 * سكريبت تهيئة قاعدة البيانات
 * 
 * يقوم بإنشاء الجداول والبيانات الافتراضية
 */

const db = require('./db-config');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎓 University Traffic Management System                  ║
║  نظام إدارة المرور الجامعي                               ║
║  Database Setup - إعداد قاعدة البيانات                   ║
╚════════════════════════════════════════════════════════════╝
    `);

    try {
        // Test connection
        console.log('\n📡 Testing database connection...');
        console.log('   اختبار الاتصال بقاعدة البيانات...\n');
        
        await db.testConnection();
        
        console.log('\n✅ Connection successful!');
        console.log('   الاتصال ناجح!\n');

        // Ask for confirmation
        const answer = await question('Do you want to initialize the database schema? (yes/no): ');
        
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            console.log('\n🔧 Initializing database schema...');
            console.log('   جاري تهيئة مخطط قاعدة البيانات...\n');
            
            await db.initializeSchema();
            
            console.log('\n✅ Schema initialized successfully!');
            console.log('   تم تهيئة المخطط بنجاح!\n');

            // Ask about default users
            const seedUsers = await question('Do you want to create default users? (yes/no): ');
            
            if (seedUsers.toLowerCase() === 'yes' || seedUsers.toLowerCase() === 'y') {
                console.log('\n👥 Creating default users...');
                console.log('   جاري إنشاء المستخدمين الافتراضيين...\n');
                
                await db.seedDefaultUsers();
                
                console.log('\n✅ Default users created successfully!');
                console.log('   تم إنشاء المستخدمين الافتراضيين بنجاح!\n');
                
                console.log('📝 Default Login Credentials:');
                console.log('   بيانات الدخول الافتراضية:\n');
                console.log('   👤 Admin:');
                console.log('      Username: admin');
                console.log('      Password: admin123\n');
                console.log('   👤 Violations Officer:');
                console.log('      Username: violations_officer');
                console.log('      Password: officer123\n');
                console.log('   👤 Inquiry User:');
                console.log('      Username: inquiry_user');
                console.log('      Password: inquiry123\n');
            }
        }

        console.log('\n✅ Setup completed successfully!');
        console.log('   تم الإعداد بنجاح!\n');
        console.log('🚀 You can now start the server with: npm start');
        console.log('   يمكنك الآن تشغيل الخادم بالأمر: npm start\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error('   فشل الإعداد:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   تأكد من:');
        console.error('   1. DATABASE_URL is set in .env file');
        console.error('      DATABASE_URL محدد في ملف .env');
        console.error('   2. Database server is accessible');
        console.error('      الخادم قابل للوصول');
        console.error('   3. Database credentials are correct');
        console.error('      بيانات الاعتماد صحيحة\n');
    } finally {
        await db.close();
        rl.close();
    }
}

// Run setup
setup();
