import { useState } from 'react';
import { Plus, MagnifyingGlass, Trash, PencilSimple, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/use-local-storage';
import { generateId, formatDateTime, fileToBase64 } from '../lib/utils';
import type { Violation } from '../lib/types';

/**
 * تبويب إدارة المخالفات
 * يتيح إضافة وعرض وتعديل وحذف المخالفات
 */
export default function ViolationsTab() {
  const [violations, setViolations] = useLocalStorage<Violation[]>('violations', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    violationType: 'وقوف خاطئ',
    location: '',
    description: '',
    fine: '',
  });
  const [images, setImages] = useState<File[]>([]);

  const violationTypes = [
    'وقوف خاطئ',
    'تجاوز السرعة',
    'عدم وجود تصريح',
    'وقوف في مكان محظور',
    'أخرى',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plateNumber || !formData.location) {
      toast.error('يرجى إدخال رقم اللوحة والموقع');
      return;
    }

    try {
      const imageUrls = await Promise.all(
        images.map(file => fileToBase64(file))
      );

      const newViolation: Violation = {
        id: generateId(),
        plateNumber: formData.plateNumber,
        violationType: formData.violationType,
        violationDate: new Date().toISOString().split('T')[0],
        violationTime: new Date().toLocaleTimeString('ar-SA'),
        location: formData.location,
        description: formData.description,
        fine: formData.fine ? parseFloat(formData.fine) : undefined,
        status: 'pending',
        imageUrls,
        createdAt: new Date().toISOString(),
      };

      setViolations([newViolation, ...violations]);
      toast.success('تم إضافة المخالفة بنجاح');
      
      // Reset form
      setFormData({
        plateNumber: '',
        violationType: 'وقوف خاطئ',
        location: '',
        description: '',
        fine: '',
      });
      setImages([]);
      setShowAddForm(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المخالفة');
      console.error(error);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المخالفة؟')) {
      setViolations(violations.filter(v => v.id !== id));
      toast.success('تم حذف المخالفة');
    }
  };

  const filteredViolations = violations.filter(v =>
    v.plateNumber.includes(searchTerm) ||
    v.location.includes(searchTerm) ||
    v.violationType.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-kufi">إدارة المخالفات</h2>
          <p className="text-gray-600 mt-1">عرض وإدارة جميع المخالفات المرورية</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition"
        >
          <Plus size={20} weight="bold" />
          <span className="font-semibold">إضافة مخالفة</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-bold mb-4">إضافة مخالفة جديدة</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">رقم اللوحة *</label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="مثال: أ ب ج 1234"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">نوع المخالفة</label>
                <select
                  value={formData.violationType}
                  onChange={(e) => setFormData({ ...formData, violationType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {violationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">الموقع *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="مثال: موقف المبنى الإداري"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">الغرامة (ريال)</label>
                <input
                  type="number"
                  value={formData.fine}
                  onChange={(e) => setFormData({ ...formData, fine: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="مثال: 300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="وصف تفصيلي للمخالفة..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                <ImageIcon className="inline ml-2" size={20} />
                الصور
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {images.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  تم اختيار {images.length} صورة
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90"
              >
                حفظ المخالفة
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="relative">
          <MagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="البحث في المخالفات..."
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">إجمالي المخالفات</p>
          <p className="text-2xl font-bold text-blue-600">{violations.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-600">قيد الانتظار</p>
          <p className="text-2xl font-bold text-yellow-600">
            {violations.filter(v => v.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">تم الدفع</p>
          <p className="text-2xl font-bold text-green-600">
            {violations.filter(v => v.status === 'paid').length}
          </p>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">رقم اللوحة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">نوع المخالفة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">الموقع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">الغرامة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    لا توجد مخالفات
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation) => (
                  <tr key={violation.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{violation.plateNumber}</td>
                    <td className="px-4 py-3">{violation.violationType}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatDateTime(violation.createdAt)}
                    </td>
                    <td className="px-4 py-3">{violation.location}</td>
                    <td className="px-4 py-3">
                      {violation.fine ? `${violation.fine} ريال` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${violation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${violation.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                        ${violation.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {violation.status === 'pending' && 'قيد الانتظار'}
                        {violation.status === 'paid' && 'تم الدفع'}
                        {violation.status === 'cancelled' && 'ملغاة'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {violation.imageUrls && violation.imageUrls.length > 0 && (
                          <button className="text-blue-600 hover:text-blue-800">
                            <ImageIcon size={18} />
                          </button>
                        )}
                        <button className="text-yellow-600 hover:text-yellow-800">
                          <PencilSimple size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(violation.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
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
