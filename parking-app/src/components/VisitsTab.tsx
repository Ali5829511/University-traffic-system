import { useState } from 'react';
import { MagnifyingGlass, UploadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/use-local-storage';
import { formatDateTime } from '../lib/utils';
import type { Visit } from '../lib/types';

/**
 * تبويب إدارة الزيارات
 * يتيح عرض وإدارة جميع زيارات المركبات
 */
export default function VisitsTab() {
  const [visits, setVisits] = useLocalStorage<Visit[]>('visits', []);
  const [searchTerm, setSearchTerm] = useState('');

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        const newVisits: Visit[] = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split(',');
            return {
              id: `import-${Date.now()}-${index}`,
              plateNumber: values[0]?.trim() || '',
              vehicleType: values[1]?.trim() || 'سيارة',
              entryTime: values[2]?.trim() || new Date().toISOString(),
              exitTime: values[3]?.trim() || undefined,
              cameraId: values[4]?.trim() || undefined,
              location: values[5]?.trim() || '',
              createdAt: new Date().toISOString(),
            };
          });

        setVisits([...newVisits, ...visits]);
        toast.success(`تم استيراد ${newVisits.length} زيارة بنجاح`);
      } catch (error) {
        toast.error('حدث خطأ أثناء استيراد البيانات');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const filteredVisits = visits.filter(v =>
    v.plateNumber.includes(searchTerm) ||
    (v.location && v.location.includes(searchTerm)) ||
    (v.cameraId && v.cameraId.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-kufi">إدارة الزيارات</h2>
          <p className="text-gray-600 mt-1">عرض جميع زيارات المركبات المسجلة</p>
        </div>
        <label className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition cursor-pointer">
          <UploadSimple size={20} weight="bold" />
          <span className="font-semibold">استيراد CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
        </label>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="relative">
          <MagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary"
            placeholder="البحث في الزيارات..."
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">إجمالي الزيارات</p>
          <p className="text-2xl font-bold text-blue-600">{visits.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">زيارات اليوم</p>
          <p className="text-2xl font-bold text-green-600">
            {visits.filter(v => {
              const today = new Date().toDateString();
              const visitDate = new Date(v.entryTime).toDateString();
              return today === visitDate;
            }).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">مركبات فريدة</p>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(visits.map(v => v.plateNumber)).size}
          </p>
        </div>
      </div>

      {/* Visits List */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">رقم اللوحة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">نوع المركبة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">وقت الدخول</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">وقت الخروج</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">الموقع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">الكاميرا</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    لا توجد زيارات
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{visit.plateNumber}</td>
                    <td className="px-4 py-3">{visit.vehicleType}</td>
                    <td className="px-4 py-3 text-sm">{formatDateTime(visit.entryTime)}</td>
                    <td className="px-4 py-3 text-sm">
                      {visit.exitTime ? formatDateTime(visit.exitTime) : '-'}
                    </td>
                    <td className="px-4 py-3">{visit.location || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visit.cameraId || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
