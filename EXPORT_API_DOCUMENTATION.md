# Export API Documentation - دليل واجهة برمجة التطبيقات للتصدير

## Overview - نظرة عامة

This document describes the REST API endpoints for exporting data in Excel and PDF formats.

يوضح هذا المستند نقاط نهاية واجهة برمجة التطبيقات REST لتصدير البيانات بتنسيقات Excel و PDF.

## API Endpoints - نقاط النهاية

### 1. Export Violations to Excel - تصدير المخالفات إلى Excel

**Endpoint:** `POST /api/export/violations/excel`

**Description:** Export violations data to Excel format with optional filters.

**Request Body:**
```json
{
  "plate_number": "ABC123",
  "violation_type": "مخالفة سرعة",
  "date_from": "2024-01-01",
  "date_to": "2024-12-31",
  "location": "المبنى رقم 1",
  "status": "جديد",
  "officer_name": "أحمد"
}
```

**Response:** Excel file download (.xlsx)

**Columns in Excel:**
- م (Number)
- رقم المخالفة (Violation Number)
- رقم اللوحة (Plate Number)
- نوع المخالفة (Violation Type)
- تاريخ المخالفة (Violation Date)
- وقت المخالفة (Violation Time)
- الموقع (Location)
- الحالة (Status)
- المبلغ (Amount)
- مدفوعة (Paid)
- اسم الضابط (Officer Name)
- ملاحظات (Notes)

---

### 2. Export Violations to PDF - تصدير المخالفات إلى PDF

**Endpoint:** `POST /api/export/violations/pdf`

**Description:** Export violations data to PDF format with optional filters. Limited to 100 records to prevent memory issues.

**Request Body:** Same as Excel export

**Response:** PDF file download (.pdf)

**Note:** Maximum 100 records will be exported to prevent memory issues.

**ملاحظة:** يتم تصدير 100 سجل كحد أقصى لتجنب مشاكل الذاكرة.

---

### 3. Export Vehicles to Excel - تصدير السيارات إلى Excel

**Endpoint:** `POST /api/export/vehicles/excel`

**Description:** Export vehicles data to Excel format with optional filters.

**Request Body:**
```json
{
  "plate_number": "ABC123",
  "owner_name": "محمد أحمد",
  "vehicle_type": "سيارة",
  "color": "أبيض"
}
```

**Response:** Excel file download (.xlsx)

**Columns in Excel:**
- م (Number)
- رقم اللوحة (Plate Number)
- اسم المالك (Owner Name)
- نوع المركبة (Vehicle Type)
- الصنع (Make)
- الموديل (Model)
- السنة (Year)
- اللون (Color)
- مسجلة (Registered)
- تاريخ التسجيل (Registration Date)
- ملاحظات (Notes)

---

### 4. Export Users to Excel - تصدير المستخدمين إلى Excel

**Endpoint:** `POST /api/export/users/excel`

**Description:** Export users data to Excel format with optional filters.

**Request Body:**
```json
{
  "username": "admin",
  "full_name": "مدير النظام",
  "email": "admin@university.edu.sa",
  "role": "admin",
  "is_active": true
}
```

**Response:** Excel file download (.xlsx)

**Columns in Excel:**
- م (Number)
- اسم المستخدم (Username)
- الاسم الكامل (Full Name)
- البريد الإلكتروني (Email)
- الهاتف (Phone)
- الدور (Role)
- نشط (Active)
- آخر تسجيل دخول (Last Login)
- تاريخ الإنشاء (Created At)

---

## Frontend Integration - التكامل مع الواجهة الأمامية

The system includes a user-friendly web interface at `api_export_page.html` that provides:

يتضمن النظام واجهة ويب سهلة الاستخدام على `api_export_page.html` توفر:

1. **Data Type Selection** - اختيار نوع البيانات
   - Violations - المخالفات
   - Vehicles - السيارات
   - Users - المستخدمين

2. **Advanced Filters** - فلاتر متقدمة
   - Dynamic filters based on selected data type
   - Support for text search, date ranges, and dropdown selections

3. **Export Options** - خيارات التصدير
   - Excel export for all data types
   - PDF export for violations (with 100 record limit)

---

## Technical Details - التفاصيل التقنية

### Libraries Used - المكتبات المستخدمة

- **xlsx**: For generating Excel files in XLSX format
- **pdfkit**: For generating PDF documents

### Security Features - ميزات الأمان

- **Parameterized queries**: All database queries use parameterized statements to prevent SQL injection
- **Input validation**: All filter inputs are validated before processing
- **Rate limiting**: API endpoints are protected with rate limiting (100 requests per 15 minutes)

### Performance Considerations - اعتبارات الأداء

- **PDF Limit**: PDF exports are limited to 100 records to prevent memory issues with large datasets
- **Excel**: No limit on Excel exports as they are more memory-efficient
- **Streaming**: File downloads use streaming to handle large files efficiently

---

## Usage Examples - أمثلة الاستخدام

### Example 1: Export All Violations to Excel

```javascript
const response = await fetch('/api/export/violations/excel', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({})  // Empty object = no filters
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'violations.xlsx';
a.click();
```

### Example 2: Export Filtered Violations to PDF

```javascript
const response = await fetch('/api/export/violations/pdf', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        status: 'جديد'
    })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'violations.pdf';
a.click();
```

---

## Error Handling - معالجة الأخطاء

All endpoints return appropriate HTTP status codes:

- **200**: Success - تم بنجاح
- **400**: Bad Request - طلب خاطئ
- **500**: Server Error - خطأ في الخادم

Error Response Format:
```json
{
    "success": false,
    "message": "خطأ في تصدير البيانات"
}
```

---

## Database Requirements - متطلبات قاعدة البيانات

The export APIs require the following database tables:

- `traffic_violations` - For violation exports
- `vehicles` - For vehicle exports
- `residents` - For vehicle owner information
- `users` - For user exports

All tables must follow the schema defined in `schema.postgres.sql`.

---

## Access Control - التحكم في الوصول

Currently, the export endpoints do not require authentication. In production environments, you should:

1. Add authentication middleware
2. Implement role-based access control
3. Add audit logging for export operations

---

## Future Enhancements - التحسينات المستقبلية

Potential improvements for the export feature:

1. **Batch Export**: Support for exporting multiple data types in a single request
2. **Email Delivery**: Option to email exported files
3. **Scheduled Exports**: Automatic periodic exports
4. **Custom Templates**: User-defined export templates
5. **Chart Integration**: Include charts and graphs in PDF exports

---

## Support - الدعم

For questions or issues, please refer to:
- Main README: `README.md`
- System Documentation: `SYSTEM_MAP.md`
- Database Guide: `database_documentation.md`

---

© 2024 University Traffic Management System - نظام إدارة المرور الجامعي
