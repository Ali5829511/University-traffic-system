/**
 * بيانات الوحدات السكنية - 114 فلة
 * Residential Units Data - 114 Villas
 * @version 2.0.0
 */

class ResidentialUnitsData {
    constructor() {
        this.storageKey = 'residential_units';
        this.init();
    }

    /**
     * تهيئة البيانات التجريبية
     */
    init() {
        if (!localStorage.getItem(this.storageKey)) {
            this.createSampleData();
        }
    }

    /**
     * إنشاء بيانات الوحدات السكنية - 114 فلة
     */
    createSampleData() {
        const units = [];
        
        // إنشاء 114 فلة حسب المواصفات المطلوبة
        for (let villaNum = 1; villaNum <= 114; villaNum++) {
            units.push({
                id: villaNum,
                unit_name: `فلة${villaNum}`,
                building_description: 'منطقة الفلل',
                building_number: 1, // All villas are in building 1 (منطقة الفلل)
                unit_number: 0, // Villas have unit_number = 0 (not apartments)
                unit_type: 'فلة',
                building_category: 'فلل',
                occupancy_status: 'مشغول', // Occupied
                is_occupied: true,
                floor_number: 0,
                resident_name: null, // Will be populated from residents table
                resident_phone: null,
                parking_number: null,
                area_sqm: 300,
                rooms_count: 5
            });
        }

        // حفظ البيانات
        localStorage.setItem(this.storageKey, JSON.stringify(units));
        console.log(`✓ تم إنشاء ${units.length} وحدة سكنية (فلل)`);
        
        return units;
    }

    /**
     * توليد اسم عشوائي
     */
    generateRandomName() {
        const firstNames = [
            'محمد', 'أحمد', 'عبدالله', 'عبدالرحمن', 'خالد', 'سعد', 'فهد', 'عبدالعزيز',
            'سلطان', 'تركي', 'ناصر', 'سعود', 'فيصل', 'مشعل', 'بندر', 'عمر'
        ];
        
        const lastNames = [
            'العتيبي', 'الدوسري', 'القحطاني', 'الشمري', 'الحربي', 'الزهراني', 'الغامدي', 'العمري',
            'المطيري', 'الشهري', 'الأحمدي', 'السهلي', 'العنزي', 'الرشيدي', 'البقمي', 'الجهني'
        ];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }

    /**
     * توليد رقم جوال عشوائي
     */
    generateRandomPhone() {
        const prefixes = ['050', '053', '054', '055', '056', '058', '059'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        
        return `${prefix}${number}`;
    }

    /**
     * الحصول على جميع الوحدات
     */
    getAllUnits() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * الحصول على الإحصائيات
     */
    getStatistics() {
        const units = this.getAllUnits();
        
        return {
            total_units: units.length,
            occupied_units: units.filter(u => u.is_occupied).length,
            vacant_units: units.filter(u => !u.is_occupied).length,
            villas_count: units.filter(u => u.unit_type === 'فلة').length,
            new_buildings_units: units.filter(u => u.building_category === 'جديد').length
        };
    }

    /**
     * البحث والتصفية
     */
    searchAndFilter(searchTerm = '', statusFilter = '', categoryFilter = '') {
        let units = this.getAllUnits();

        // البحث
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            units = units.filter(unit => 
                (unit.unit_name && unit.unit_name.toLowerCase().includes(term)) ||
                (unit.building_number && unit.building_number.toString().includes(term)) ||
                (unit.unit_number && unit.unit_number.toString().includes(term)) ||
                (unit.resident_name && unit.resident_name.toLowerCase().includes(term))
            );
        }

        // تصفية حسب الحالة
        if (statusFilter) {
            units = units.filter(unit => unit.occupancy_status === statusFilter);
        }

        // تصفية حسب الفئة
        if (categoryFilter) {
            units = units.filter(unit => unit.building_category === categoryFilter);
        }

        return units;
    }

    /**
     * مسح جميع البيانات
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        console.log('✓ تم مسح جميع بيانات الوحدات السكنية');
    }

    /**
     * إعادة إنشاء البيانات
     */
    reset() {
        this.clearAll();
        return this.createSampleData();
    }
}

// إنشاء نسخة عامة
const residentialUnitsDB = new ResidentialUnitsData();

// تصدير للاستخدام في الصفحات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResidentialUnitsData;
}
