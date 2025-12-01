#!/usr/bin/env node
/**
 * Stickers Import Script
 * سكريبت استيراد بيانات الملصقات من Excel
 * 
 * يقوم باستيراد بيانات الملصقات من صفحتين في ملف Excel
 * - صفحة "فعال" - الملصقات النشطة
 * - صفحة "ملغي" - الملصقات الملغاة
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// قراءة ملف Excel
const excelFilePath = path.join(__dirname, '../../ملصقاتالسيارات.xlsx');
const outputFilePath = path.join(__dirname, '../../stickers_data.json');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  📋 Stickers Import Script                                ║');
console.log('║  سكريبت استيراد بيانات الملصقات                           ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

try {
    // قراءة ملف Excel
    console.log('📖 Reading Excel file...');
    console.log('   جاري قراءة ملف Excel...');
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('✓ Excel file loaded successfully');
    console.log(`  Available sheets: ${workbook.SheetNames.join(', ')}`);
    console.log('');
    
    const allStickers = [];
    
    // معالجة كل صفحة
    workbook.SheetNames.forEach(sheetName => {
        console.log(`📄 Processing sheet: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`   Found ${jsonData.length} records`);
        
        // تحويل البيانات إلى الشكل المطلوب
        jsonData.forEach((row, index) => {
            // تحويل تاريخ Excel إلى تاريخ JavaScript
            let issueDate = new Date().toISOString();
            if (row['تاريخ الإصدار']) {
                const excelDate = row['تاريخ الإصدار'];
                // Excel dates are stored as numbers (days since 1900-01-01)
                if (typeof excelDate === 'number') {
                    // Excel incorrectly treats 1900 as a leap year, so we use 1899-12-31
                    const excelEpoch = new Date(1899, 11, 31);
                    const jsDate = new Date(excelEpoch.getTime() + excelDate * 86400000);
                    issueDate = jsDate.toISOString();
                } else if (excelDate instanceof Date) {
                    issueDate = excelDate.toISOString();
                }
            }
            
            const sticker = {
                id: `${sheetName}_${index + 1}`,
                stickerNumber: row['رقم ملصق'] || row['رقم الملصق'] || '',
                residentName: row['اسم الساكن'] || '',
                status: row['حالة ملصق'] || row['حالة الملصق'] || sheetName,
                issueDate: issueDate,
                plateNumber: row['رقم للوحة السيارة'] || row['رقم اللوحة'] || '',
                vehicleType: row['نوع المركبة'] || '',
                nationalId: row['رقم الهوية'] || '',
                unit: row['الوحدة'] || '',
                building: row['المبنى'] || '',
                apartment: row['الشقة'] || '',
                sheetSource: sheetName, // إضافة مصدر البيانات
                importedAt: new Date().toISOString()
            };
            
            allStickers.push(sticker);
        });
        
        console.log(`✓ Processed ${jsonData.length} records from ${sheetName}`);
        console.log('');
    });
    
    // إحصائيات
    const activeStickers = allStickers.filter(s => s.sheetSource === 'فعال');
    const cancelledStickers = allStickers.filter(s => s.sheetSource === 'ملغي');
    
    console.log('📊 Statistics:');
    console.log(`   Total stickers: ${allStickers.length}`);
    console.log(`   Active (فعال): ${activeStickers.length}`);
    console.log(`   Cancelled (ملغي): ${cancelledStickers.length}`);
    console.log('');
    
    // حفظ البيانات في ملف JSON
    const outputData = {
        metadata: {
            importDate: new Date().toISOString(),
            totalCount: allStickers.length,
            activeCount: activeStickers.length,
            cancelledCount: cancelledStickers.length,
            source: 'ملصقاتالسيارات.xlsx',
            sheets: workbook.SheetNames
        },
        stickers: allStickers
    };
    
    fs.writeFileSync(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log('✅ Data exported successfully!');
    console.log(`   Output file: ${outputFilePath}`);
    console.log('   تم تصدير البيانات بنجاح!');
    console.log('');
    
    // طباعة عينة من البيانات
    console.log('📋 Sample data (first 3 records):');
    allStickers.slice(0, 3).forEach((sticker, index) => {
        console.log(`   ${index + 1}. ${sticker.stickerNumber} - ${sticker.residentName} - ${sticker.status}`);
    });
    console.log('');
    
    console.log('✅ Import completed successfully!');
    console.log('   تم الاستيراد بنجاح!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Review the generated stickers_data.json file');
    console.log('   2. Use this data to update the database');
    console.log('   راجع ملف stickers_data.json المُنشأ');
    console.log('');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   خطأ:', error.message);
    process.exit(1);
}
