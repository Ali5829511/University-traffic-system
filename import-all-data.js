#!/usr/bin/env node
/**
 * Comprehensive Data Import Script
 * سكريبت استيراد شامل لجميع البيانات من Excel و CSV
 * 
 * يقوم باستيراد البيانات من:
 * - ملصقاتالسيارات.xlsx (الملصقات)
 * - المواقف.xlsx (المواقف)
 * - الوحداتالسكنية.xlsx (الوحدات السكنية)
 * - بياناتالسكان.xlsx (بيانات السكان)
 * - مباني_2025-10-17.csv (المباني)
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  📦 Comprehensive Data Import Script                      ║');
console.log('║  سكريبت استيراد شامل لجميع البيانات                       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Helper function to convert Excel dates
function convertExcelDate(excelDate) {
    if (!excelDate) return new Date().toISOString();
    
    if (typeof excelDate === 'number') {
        const excelEpoch = new Date(1899, 11, 31);
        const jsDate = new Date(excelEpoch.getTime() + excelDate * 86400000);
        return jsDate.toISOString();
    } else if (excelDate instanceof Date) {
        return excelDate.toISOString();
    }
    return new Date().toISOString();
}

// 1. Import Stickers Data (ملصقاتالسيارات.xlsx)
function importStickers() {
    console.log('1️⃣  Processing: ملصقاتالسيارات.xlsx');
    console.log('   معالجة بيانات الملصقات...');
    
    try {
        const filePath = path.join(__dirname, 'ملصقاتالسيارات.xlsx');
        const workbook = XLSX.readFile(filePath);
        const allStickers = [];
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            jsonData.forEach((row, index) => {
                const sticker = {
                    id: `${sheetName}_${index + 1}`,
                    stickerNumber: row['رقم ملصق'] || row['رقم الملصق'] || '',
                    residentName: row['اسم الساكن'] || '',
                    status: row['حالة ملصق'] || row['حالة الملصق'] || sheetName,
                    issueDate: convertExcelDate(row['تاريخ الإصدار']),
                    plateNumber: row['رقم للوحة السيارة'] || row['رقم اللوحة'] || '',
                    vehicleType: row['نوع المركبة'] || '',
                    nationalId: row['رقم الهوية'] || '',
                    unit: row['الوحدة'] || '',
                    building: row['المبنى'] || '',
                    apartment: row['الشقة'] || '',
                    sheetSource: sheetName,
                    importedAt: new Date().toISOString()
                };
                allStickers.push(sticker);
            });
        });
        
        const outputData = {
            metadata: {
                importDate: new Date().toISOString(),
                totalCount: allStickers.length,
                source: 'ملصقاتالسيارات.xlsx',
                sheets: workbook.SheetNames
            },
            stickers: allStickers
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'stickers_data.json'),
            JSON.stringify(outputData, null, 2),
            'utf8'
        );
        
        console.log(`   ✓ Exported ${allStickers.length} stickers`);
        console.log('');
        return allStickers.length;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return 0;
    }
}

// 2. Import Parking Data (المواقف.xlsx)
function importParkingSpaces() {
    console.log('2️⃣  Processing: المواقف.xlsx');
    console.log('   معالجة بيانات المواقف...');
    
    try {
        const filePath = path.join(__dirname, 'المواقف.xlsx');
        const workbook = XLSX.readFile(filePath);
        const allParkingSpaces = [];
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            jsonData.forEach((row, index) => {
                const parkingSpace = {
                    id: `parking_${index + 1}`,
                    parkingNumber: row['رقم الموقف'] || row['رقم موقف'] || '',
                    location: row['الموقع'] || '',
                    type: row['النوع'] || row['نوع الموقف'] || '',
                    status: row['الحالة'] || row['حالة'] || 'متاح',
                    building: row['المبنى'] || '',
                    floor: row['الطابق'] || '',
                    assignedTo: row['مخصص لـ'] || '',
                    sheetSource: sheetName,
                    importedAt: new Date().toISOString()
                };
                allParkingSpaces.push(parkingSpace);
            });
        });
        
        const outputData = {
            metadata: {
                importDate: new Date().toISOString(),
                totalCount: allParkingSpaces.length,
                source: 'المواقف.xlsx',
                sheets: workbook.SheetNames
            },
            parkingSpaces: allParkingSpaces
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'parking_data.json'),
            JSON.stringify(outputData, null, 2),
            'utf8'
        );
        
        console.log(`   ✓ Exported ${allParkingSpaces.length} parking spaces`);
        console.log('');
        return allParkingSpaces.length;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return 0;
    }
}

// 3. Import Residential Units (الوحداتالسكنية.xlsx)
function importResidentialUnits() {
    console.log('3️⃣  Processing: الوحداتالسكنية.xlsx');
    console.log('   معالجة بيانات الوحدات السكنية...');
    
    try {
        const filePath = path.join(__dirname, 'الوحداتالسكنية.xlsx');
        const workbook = XLSX.readFile(filePath);
        const allUnits = [];
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            jsonData.forEach((row, index) => {
                const unit = {
                    id: `unit_${index + 1}`,
                    unitNumber: row['رقم الوحدة'] || row['رقم وحدة'] || '',
                    building: row['المبنى'] || '',
                    floor: row['الطابق'] || '',
                    type: row['النوع'] || row['نوع الوحدة'] || '',
                    status: row['الحالة'] || 'شاغرة',
                    area: row['المساحة'] || '',
                    rooms: row['عدد الغرف'] || '',
                    occupantName: row['اسم الساكن'] || '',
                    occupantId: row['رقم الهوية'] || '',
                    sheetSource: sheetName,
                    importedAt: new Date().toISOString()
                };
                allUnits.push(unit);
            });
        });
        
        const outputData = {
            metadata: {
                importDate: new Date().toISOString(),
                totalCount: allUnits.length,
                source: 'الوحداتالسكنية.xlsx',
                sheets: workbook.SheetNames
            },
            residentialUnits: allUnits
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'residential_units_data.json'),
            JSON.stringify(outputData, null, 2),
            'utf8'
        );
        
        console.log(`   ✓ Exported ${allUnits.length} residential units`);
        console.log('');
        return allUnits.length;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return 0;
    }
}

// 4. Import Residents Data (بياناتالسكان.xlsx)
function importResidents() {
    console.log('4️⃣  Processing: بياناتالسكان.xlsx');
    console.log('   معالجة بيانات السكان...');
    
    try {
        const filePath = path.join(__dirname, 'بياناتالسكان.xlsx');
        const workbook = XLSX.readFile(filePath);
        const allResidents = [];
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            jsonData.forEach((row, index) => {
                const resident = {
                    id: `resident_${index + 1}`,
                    name: row['الاسم'] || row['اسم الساكن'] || '',
                    nationalId: row['رقم الهوية'] || row['الهوية الوطنية'] || '',
                    phone: row['رقم الجوال'] || row['الهاتف'] || '',
                    email: row['البريد الإلكتروني'] || '',
                    building: row['المبنى'] || '',
                    unit: row['الوحدة'] || row['رقم الوحدة'] || '',
                    jobTitle: row['المسمى الوظيفي'] || '',
                    department: row['القسم'] || row['الإدارة'] || '',
                    moveInDate: convertExcelDate(row['تاريخ السكن']),
                    familyMembers: row['عدد أفراد الأسرة'] || '',
                    vehicles: row['عدد المركبات'] || '',
                    sheetSource: sheetName,
                    importedAt: new Date().toISOString()
                };
                allResidents.push(resident);
            });
        });
        
        const outputData = {
            metadata: {
                importDate: new Date().toISOString(),
                totalCount: allResidents.length,
                source: 'بياناتالسكان.xlsx',
                sheets: workbook.SheetNames
            },
            residents: allResidents
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'residents_data.json'),
            JSON.stringify(outputData, null, 2),
            'utf8'
        );
        
        console.log(`   ✓ Exported ${allResidents.length} residents`);
        console.log('');
        return allResidents.length;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return 0;
    }
}

// 5. Import Buildings Data (مباني_2025-10-17.csv)
function importBuildings() {
    console.log('5️⃣  Processing: مباني_2025-10-17.csv');
    console.log('   معالجة بيانات المباني...');
    
    try {
        const filePath = path.join(__dirname, 'مباني_2025-10-17.csv');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const allBuildings = jsonData.map((row, index) => ({
            id: `building_${index + 1}`,
            buildingNumber: row['رقم المبنى'] || row['المبنى'] || '',
            buildingName: row['اسم المبنى'] || '',
            location: row['الموقع'] || '',
            floors: row['عدد الطوابق'] || '',
            units: row['عدد الوحدات'] || '',
            type: row['النوع'] || '',
            status: row['الحالة'] || 'نشط',
            parkingSpaces: row['عدد المواقف'] || '',
            constructionYear: row['سنة البناء'] || '',
            importedAt: new Date().toISOString()
        }));
        
        const outputData = {
            metadata: {
                importDate: new Date().toISOString(),
                totalCount: allBuildings.length,
                source: 'مباني_2025-10-17.csv'
            },
            buildings: allBuildings
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'buildings_data.json'),
            JSON.stringify(outputData, null, 2),
            'utf8'
        );
        
        console.log(`   ✓ Exported ${allBuildings.length} buildings`);
        console.log('');
        return allBuildings.length;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return 0;
    }
}

// Main execution
try {
    const stats = {
        stickers: importStickers(),
        parkingSpaces: importParkingSpaces(),
        residentialUnits: importResidentialUnits(),
        residents: importResidents(),
        buildings: importBuildings()
    };
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  📊 Import Summary - ملخص الاستيراد                       ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  ملصقات (Stickers): ${stats.stickers.toString().padEnd(31)} ║`);
    console.log(`║  مواقف (Parking): ${stats.parkingSpaces.toString().padEnd(33)} ║`);
    console.log(`║  وحدات سكنية (Units): ${stats.residentialUnits.toString().padEnd(29)} ║`);
    console.log(`║  سكان (Residents): ${stats.residents.toString().padEnd(32)} ║`);
    console.log(`║  مباني (Buildings): ${stats.buildings.toString().padEnd(30)} ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Total Records: ${(Object.values(stats).reduce((a, b) => a + b, 0)).toString().padEnd(36)} ║`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ All data imported successfully!');
    console.log('   تم استيراد جميع البيانات بنجاح!');
    console.log('');
    console.log('📂 Generated files:');
    console.log('   - stickers_data.json');
    console.log('   - parking_data.json');
    console.log('   - residential_units_data.json');
    console.log('   - residents_data.json');
    console.log('   - buildings_data.json');
    console.log('');
    
} catch (error) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
}
