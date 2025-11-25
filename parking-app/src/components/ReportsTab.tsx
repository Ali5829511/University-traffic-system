import { useState } from 'react';
import { FilePdf, FileXls, FileCsv } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/use-local-storage';
import { downloadFile, formatDateTime } from '../lib/utils';
import type { Visit, Violation } from '../lib/types';

/**
 * تبويب التقارير
 * توليد وتصدير التقارير بصيغ متعددة
 */
export default function ReportsTab() {
  const [visits] = useLocalStorage<Visit[]>('visits', []);
  const [violations] = useLocalStorage<Violation[]>('violations', []);
  const [reportType, setReportType] = useState('violations');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const generateCSV = () => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'violations') {
      csvContent = 'رقم اللوحة,نوع المخالفة,التاريخ,الوقت,الموقع,الغرامة,الحالة\n';
      violations.forEach(v => {
        csvContent += `${v.plateNumber},${v.violationType},${v.violationDate},${v.violationTime},${v.location},${v.fine || 0},${v.status}\n`;
      });
      filename = `violations_${Date.now()}.csv`;
    } else if (reportType === 'visits') {
      csvContent = 'رقم اللوحة,نوع المركبة,وقت الدخول,وقت الخروج,الموقع,الكاميرا\n';
      visits.forEach(v => {
        csvContent += `${v.plateNumber},${v.vehicleType},${v.entryTime},${v.exitTime || ''},${v.location || ''},${v.cameraId || ''}\n`;
      });
      filename = `visits_${Date.now()}.csv`;
    }

    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    toast.success('تم تصدير التقرير بنجاح');
  };

  const generateExcel = () => {
    toast.info('يتطلب تثبيت مكتبة xlsx');
    // سيتم تنفيذه لاحقاً مع مكتبة xlsx
  };

  const generatePDF = () => {
    toast.info('يتطلب تثبيت مكتبة jsPDF');
    // سيتم تنفيذه لاحقاً مع مكتبة jsPDF
  };

  const generateHTML = () => {
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير ${reportType === 'violations' ? 'المخالفات' : 'الزيارات'}</title>
        <style>
          body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; }
          h1 { color: #1e40af; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #1e40af; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <h1>جامعة الإمام محمد بن سعود الإسلامية</h1>
        <h2 style="text-align: center;">تقرير ${reportType === 'violations' ? 'المخالفات' : 'الزيارات'}</h2>
        <p style="text-align: center;">تاريخ التقرير: ${formatDateTime(new Date())}</p>
    `;

    if (reportType === 'violations') {
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>رقم اللوحة</th>
              <th>نوع المخالفة</th>
              <th>التاريخ</th>
              <th>الموقع</th>
              <th>الغرامة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
      `;
      violations.forEach(v => {
        htmlContent += `
          <tr>
            <td>${v.plateNumber}</td>
            <td>${v.violationType}</td>
            <td>${formatDateTime(v.createdAt)}</td>
            <td>${v.location}</td>
            <td>${v.fine || 0} ريال</td>
            <td>${v.status === 'pending' ? 'قيد الانتظار' : v.status === 'paid' ? 'تم الدفع' : 'ملغاة'}</td>
          </tr>
        `;
      });
      htmlContent += '</tbody></table>';
    } else {
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>رقم اللوحة</th>
              <th>نوع المركبة</th>
              <th>وقت الدخول</th>
              <th>وقت الخروج</th>
              <th>الموقع</th>
            </tr>
          </thead>
          <tbody>
      `;
      visits.forEach(v => {
        htmlContent += `
          <tr>
            <td>${v.plateNumber}</td>
            <td>${v.vehicleType}</td>
            <td>${formatDateTime(v.entryTime)}</td>
            <td>${v.exitTime ? formatDateTime(v.exitTime) : '-'}</td>
            <td>${v.location || '-'}</td>
          </tr>
        `;
      });
      htmlContent += '</tbody></table>';
    }

    htmlContent += `
        <div class="footer">
          <p>نظام إدارة مواقف السيارات والمخالفات المرورية</p>
          <p>© ${new Date().getFullYear()} جامعة الإمام محمد بن سعود الإسلامية</p>
        </div>
      </body>
      </html>
    `;

    // فتح في نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      toast.success('تم فتح التقرير في نافذة جديدة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-kufi">التقارير</h2>
        <p className="text-gray-600 mt-1">توليد وتصدير التقارير بصيغ متعددة</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-bold mb-4">إعدادات التقرير</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="violations">تقرير المخالفات</option>
              <option value="visits">تقرير الزيارات</option>
              <option value="vehicles">تقرير المركبات</option>
              <option value="comprehensive">تقرير شامل</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-bold mb-4">خيارات التصدير</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={generateHTML}
            className="flex flex-col items-center gap-3 p-6 border-2 border-primary rounded-lg hover:bg-primary/5 transition"
          >
            <FilePdf size={48} className="text-red-600" weight="fill" />
            <div className="text-center">
              <p className="font-bold">تقرير HTML</p>
              <p className="text-xs text-gray-600">جاهز للطباعة</p>
            </div>
          </button>

          <button
            onClick={generatePDF}
            className="flex flex-col items-center gap-3 p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FilePdf size={48} className="text-red-600" weight="fill" />
            <div className="text-center">
              <p className="font-bold">تصدير PDF</p>
              <p className="text-xs text-gray-600">قيد التطوير</p>
            </div>
          </button>

          <button
            onClick={generateExcel}
            className="flex flex-col items-center gap-3 p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FileXls size={48} className="text-green-600" weight="fill" />
            <div className="text-center">
              <p className="font-bold">تصدير Excel</p>
              <p className="text-xs text-gray-600">قيد التطوير</p>
            </div>
          </button>

          <button
            onClick={generateCSV}
            className="flex flex-col items-center gap-3 p-6 border-2 border-secondary rounded-lg hover:bg-secondary/5 transition"
          >
            <FileCsv size={48} className="text-blue-600" weight="fill" />
            <div className="text-center">
              <p className="font-bold">تصدير CSV</p>
              <p className="text-xs text-gray-600">جاهز</p>
            </div>
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-bold mb-4">ملخص الإحصائيات</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">إجمالي المخالفات</p>
            <p className="text-4xl font-bold text-blue-700">{violations.length}</p>
            <p className="text-xs text-gray-600 mt-2">
              قيد الانتظار: {violations.filter(v => v.status === 'pending').length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">إجمالي الزيارات</p>
            <p className="text-4xl font-bold text-green-700">{visits.length}</p>
            <p className="text-xs text-gray-600 mt-2">
              زيارات اليوم: {visits.filter(v => {
                const today = new Date().toDateString();
                const visitDate = new Date(v.entryTime).toDateString();
                return today === visitDate;
              }).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">مركبات فريدة</p>
            <p className="text-4xl font-bold text-purple-700">
              {new Set([...visits.map(v => v.plateNumber), ...violations.map(v => v.plateNumber)]).size}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              بمخالفات: {new Set(violations.map(v => v.plateNumber)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
