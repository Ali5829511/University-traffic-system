#!/usr/bin/env node
/**
 * Import Visits with Images and PDF Report Generation
 * استيراد الزيارات مع الصور وتوليد تقرير PDF
 * 
 * يقوم هذا السكريبت بـ:
 * 1. استيراد بيانات الزيارات من ملف CSV
 * 2. تحميل الصور من الروابط وحفظها محلياً
 * 3. إنشاء تقرير Excel مع صور مصغّرة
 * 4. إنشاء تقرير PDF رسمي مع صور للطباعة والأرشفة القضائية
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
require('dotenv').config();

// إعدادات المسارات / Path configurations
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, '..', 'data', 'images');
const RESULTS_DIR = process.env.RESULTS_DIR || path.join(__dirname, '..', 'data', 'results');
const DEFAULT_CSV_PATH = path.join(__dirname, '..', 'data', 'visits.csv');

// إنشاء المجلدات إذا لم تكن موجودة / Create directories if they don't exist
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Database connection (optional, only if DATABASE_URL is configured)
let db = null;
try {
    const dbConfig = require('../db-config');
    db = dbConfig;
} catch (error) {
    console.log('⚠️ قاعدة البيانات غير متصلة - سيتم الاستمرار بدون حفظ في قاعدة البيانات');
}

/**
 * Parse timestamp from date and time strings
 * تحويل التاريخ والوقت إلى timestamp
 */
function parseTimestamp(date, time) {
    if (!date || !time || typeof time !== 'string' || !time.trim()) {
        return null;
    }
    try {
        const dateStr = String(date).trim();
        const timeStr = String(time).trim();
        const combined = `${dateStr} ${timeStr}`;
        const parsed = new Date(combined);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString();
    } catch (error) {
        return null;
    }
}

/**
 * Download image from URL and save locally
 * تحميل الصورة من الرابط وحفظها محلياً
 */
async function downloadImage(imageUrl, licensePlate) {
    return new Promise((resolve, reject) => {
        if (!imageUrl || !licensePlate) {
            resolve(null);
            return;
        }

        const sanitizedPlate = String(licensePlate).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
        const imagePath = path.join(IMAGES_DIR, `${sanitizedPlate}.jpg`);
        
        // Check if image already exists
        if (fs.existsSync(imagePath)) {
            resolve(imagePath);
            return;
        }

        const protocol = imageUrl.startsWith('https') ? https : http;
        
        const request = protocol.get(imageUrl, { timeout: 10000 }, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(imagePath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(imagePath);
                });
                fileStream.on('error', (err) => {
                    fs.unlink(imagePath, () => {});
                    reject(err);
                });
            } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Follow redirect
                downloadImage(response.headers.location, licensePlate)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error(`HTTP ${response.statusCode}`));
            }
        });

        request.on('error', (err) => {
            reject(err);
        });

        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Parse CSV file and return rows
 * قراءة ملف CSV وإرجاع البيانات
 */
function parseCSV(csvPath) {
    const workbook = XLSX.readFile(csvPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Generate Excel report with thumbnails
 * إنشاء تقرير Excel مع الصور المصغّرة
 */
function generateExcelReport(rows) {
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel (note: xlsx doesn't support embedded images in JSON format)
    const excelData = rows.map((row, index) => ({
        'م': index + 1,
        'صورة': row.image_path ? '[متوفرة]' : '[غير متوفرة]',
        'رقم اللوحة': row.license_plate || '',
        'النوع': row.type || '',
        'اللون': row.color || '',
        'الموقع': row.site || '',
        'تاريخ ووقت الدخول': row.entrance_ts ? new Date(row.entrance_ts).toLocaleString('ar-SA') : '',
        'مسار الصورة': row.image_path || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 },   // م
        { wch: 12 },  // صورة
        { wch: 15 },  // رقم اللوحة
        { wch: 12 },  // النوع
        { wch: 10 },  // اللون
        { wch: 20 },  // الموقع
        { wch: 25 },  // تاريخ الدخول
        { wch: 40 }   // مسار الصورة
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الزيارات');
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const excelFile = path.join(RESULTS_DIR, `تقرير_الزيارات_${timestamp}.xlsx`);
    XLSX.writeFile(workbook, excelFile);
    
    return excelFile;
}

/**
 * Generate PDF report with thumbnails
 * إنشاء تقرير PDF رسمي مع الصور المصغّرة
 */
async function generatePDFReport(rows) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const pdfFile = path.join(RESULTS_DIR, `تقرير_الزيارات_${timestamp}.pdf`);
        
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: 'تقرير الزيارات',
                Author: 'نظام إدارة المرور الجامعي',
                Subject: 'تقرير رسمي للزيارات مع الصور',
                CreationDate: new Date()
            }
        });
        
        const stream = fs.createWriteStream(pdfFile);
        doc.pipe(stream);
        
        // Header
        doc.fontSize(20).text('تقرير الزيارات الرسمي', { align: 'center' });
        doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, { align: 'center' });
        doc.fontSize(10).text('وحدة إسكان هيئة التدريس - جامعة الإمام محمد بن سعود الإسلامية', { align: 'center' });
        doc.moveDown(2);
        
        // Draw table header
        doc.fontSize(10);
        
        let yPosition = doc.y;
        const pageHeight = 750;
        const rowHeight = 80;
        
        rows.forEach((row, index) => {
            // Check if we need a new page
            if (yPosition + rowHeight > pageHeight) {
                doc.addPage();
                yPosition = 50;
            }
            
            // Row separator
            if (index > 0) {
                doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
                yPosition += 10;
            }
            
            // Draw image thumbnail if available
            const startY = yPosition;
            if (row.image_path && fs.existsSync(row.image_path)) {
                try {
                    doc.image(row.image_path, 50, yPosition, { 
                        width: 60, 
                        height: 45,
                        fit: [60, 45]
                    });
                } catch (imgError) {
                    doc.text('[صورة غير متوفرة]', 50, yPosition, { width: 60 });
                }
            } else {
                doc.text('[لا توجد صورة]', 50, yPosition + 15, { width: 60 });
            }
            
            // Text information
            const textX = 120;
            doc.fontSize(10);
            doc.text(`${index + 1}. رقم اللوحة: ${row.license_plate || 'غير متوفر'}`, textX, startY);
            doc.text(`    النوع: ${row.type || 'غير متوفر'}`, textX, startY + 12);
            doc.text(`    اللون: ${row.color || 'غير متوفر'}`, textX, startY + 24);
            doc.text(`    الموقع: ${row.site || 'غير متوفر'}`, textX, startY + 36);
            doc.text(`    التاريخ: ${row.entrance_ts ? new Date(row.entrance_ts).toLocaleString('ar-SA') : 'غير متوفر'}`, textX, startY + 48);
            
            yPosition = startY + rowHeight;
            doc.y = yPosition;
        });
        
        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text(`إجمالي السجلات: ${rows.length}`, { align: 'center' });
        doc.text('تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المرور', { align: 'center' });
        doc.text('هذا التقرير صالح للأرشفة القضائية والرسمية', { align: 'center' });
        
        doc.end();
        
        stream.on('finish', () => {
            resolve(pdfFile);
        });
        
        stream.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Save rows to database
 * حفظ السجلات في قاعدة البيانات
 */
async function saveToDatabase(rows) {
    if (!db || !db.pool) {
        console.log('⚠️ قاعدة البيانات غير متصلة - تخطي الحفظ في قاعدة البيانات');
        return false;
    }
    
    try {
        // Create visits table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS visits (
                id SERIAL PRIMARY KEY,
                license_plate VARCHAR(50),
                type VARCHAR(50),
                color VARCHAR(50),
                site VARCHAR(100),
                entrance_ts TIMESTAMP,
                image_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert rows
        for (const row of rows) {
            await db.query(
                `INSERT INTO visits (license_plate, type, color, site, entrance_ts, image_path)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [row.license_plate, row.type, row.color, row.site, row.entrance_ts, row.image_path]
            );
        }
        
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات في قاعدة البيانات:', error.message);
        return false;
    }
}

/**
 * Main import function
 * دالة الاستيراد الرئيسية
 */
async function run(csvPath = DEFAULT_CSV_PATH) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  📦 Import Visits with Images and PDF Report              ║');
    console.log('║  استيراد الزيارات مع الصور وتقرير PDF                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ ملف CSV غير موجود: ${csvPath}`);
        console.log('');
        console.log('📋 يجب أن يحتوي ملف CSV على الأعمدة التالية:');
        console.log('   - license_plate: رقم اللوحة');
        console.log('   - type: نوع المركبة');
        console.log('   - color: لون المركبة');
        console.log('   - site: الموقع');
        console.log('   - entrance_date: تاريخ الدخول');
        console.log('   - entrance_time: وقت الدخول');
        console.log('   - image_url: رابط الصورة (اختياري)');
        return { success: false, error: 'CSV file not found' };
    }
    
    console.log(`📄 قراءة ملف CSV: ${csvPath}`);
    
    // Parse CSV
    let csvData;
    try {
        csvData = parseCSV(csvPath);
        console.log(`   ✓ تم قراءة ${csvData.length} سجل`);
    } catch (error) {
        console.error(`❌ خطأ في قراءة ملف CSV: ${error.message}`);
        return { success: false, error: error.message };
    }
    
    console.log('');
    console.log('🖼️  تحميل الصور...');
    
    // Process rows and download images
    const rows = [];
    let imagesDownloaded = 0;
    let imagesFailed = 0;
    
    for (const record of csvData) {
        const plate = String(record.license_plate || record['رقم اللوحة'] || '').trim();
        const imageUrl = record.image_url || record['رابط الصورة'] || null;
        let imagePath = null;
        
        // Download image if URL provided
        if (imageUrl && plate) {
            try {
                imagePath = await downloadImage(imageUrl, plate);
                if (imagePath) {
                    imagesDownloaded++;
                    console.log(`   ✓ تم تحميل صورة: ${plate}`);
                }
            } catch (error) {
                imagesFailed++;
                console.log(`   ⚠️ فشل تحميل صورة ${plate}: ${error.message}`);
            }
        }
        
        rows.push({
            license_plate: plate,
            type: record.type || record['النوع'] || null,
            color: record.color || record['اللون'] || null,
            site: record.site || record['الموقع'] || null,
            entrance_ts: parseTimestamp(
                record.entrance_date || record['تاريخ الدخول'], 
                record.entrance_time || record['وقت الدخول']
            ),
            image_path: imagePath
        });
    }
    
    console.log(`   ✓ تم تحميل ${imagesDownloaded} صورة`);
    if (imagesFailed > 0) {
        console.log(`   ⚠️ فشل تحميل ${imagesFailed} صورة`);
    }
    
    console.log('');
    console.log('💾 حفظ البيانات...');
    
    // Save to database
    const dbResult = await saveToDatabase(rows);
    if (dbResult) {
        console.log(`   ✓ تم حفظ ${rows.length} سجل في قاعدة البيانات`);
    }
    
    console.log('');
    console.log('📊 إنشاء تقرير Excel...');
    
    // Generate Excel report
    let excelFile;
    try {
        excelFile = generateExcelReport(rows);
        console.log(`   ✓ تم حفظ التقرير: ${excelFile}`);
    } catch (error) {
        console.error(`   ❌ خطأ في إنشاء تقرير Excel: ${error.message}`);
    }
    
    console.log('');
    console.log('📄 إنشاء تقرير PDF...');
    
    // Generate PDF report
    let pdfFile;
    try {
        pdfFile = await generatePDFReport(rows);
        console.log(`   ✓ تم حفظ التقرير: ${pdfFile}`);
    } catch (error) {
        console.error(`   ❌ خطأ في إنشاء تقرير PDF: ${error.message}`);
    }
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  📊 ملخص الاستيراد / Import Summary                       ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  سجلات مستوردة: ${String(rows.length).padEnd(35)} ║`);
    console.log(`║  صور محمّلة: ${String(imagesDownloaded).padEnd(39)} ║`);
    console.log(`║  صور فاشلة: ${String(imagesFailed).padEnd(40)} ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  📂 الملفات الناتجة:                                      ║');
    if (excelFile) {
        console.log(`║  • Excel: ${path.basename(excelFile).padEnd(40)} ║`);
    }
    if (pdfFile) {
        console.log(`║  • PDF: ${path.basename(pdfFile).padEnd(42)} ║`);
    }
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ تم الاستيراد بنجاح!');
    
    return {
        success: true,
        recordsImported: rows.length,
        imagesDownloaded,
        imagesFailed,
        excelFile,
        pdfFile
    };
}

// Export for use as module
module.exports = { run, parseCSV, generateExcelReport, generatePDFReport, downloadImage };

// Run if executed directly
if (require.main === module) {
    const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
    run(csvPath)
        .then(result => {
            if (!result.success) {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ خطأ:', error.message);
            process.exit(1);
        });
}
