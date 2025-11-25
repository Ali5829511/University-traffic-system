import { useState, useEffect } from 'react';
import { Car, MagnifyingGlass } from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { formatDateTime } from '../lib/utils';
import type { Vehicle, Visit, Violation } from '../lib/types';

/**
 * تبويب إدارة المركبات
 * تجميع تلقائي للمركبات من الزيارات والمخالفات
 */
export default function VehiclesTab() {
  const [visits] = useLocalStorage<Visit[]>('visits', []);
  const [violations] = useLocalStorage<Violation[]>('violations', []);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // تجميع المركبات تلقائياً
  useEffect(() => {
    const vehicleMap = new Map<string, Vehicle>();

    // معالجة الزيارات
    visits.forEach(visit => {
      const existing = vehicleMap.get(visit.plateNumber);
      if (existing) {
        existing.totalVisits++;
        existing.lastSeen = visit.entryTime;
        if (visit.imageUrl && !existing.imageUrls.includes(visit.imageUrl)) {
          existing.imageUrls.push(visit.imageUrl);
        }
      } else {
        vehicleMap.set(visit.plateNumber, {
          plateNumber: visit.plateNumber,
          firstSeen: visit.entryTime,
          lastSeen: visit.entryTime,
          totalVisits: 1,
          totalViolations: 0,
          imageUrls: visit.imageUrl ? [visit.imageUrl] : [],
          vehicleType: visit.vehicleType,
        });
      }
    });

    // معالجة المخالفات
    violations.forEach(violation => {
      const existing = vehicleMap.get(violation.plateNumber);
      if (existing) {
        existing.totalViolations++;
        if (violation.imageUrls) {
          violation.imageUrls.forEach(url => {
            if (!existing.imageUrls.includes(url)) {
              existing.imageUrls.push(url);
            }
          });
        }
      } else {
        vehicleMap.set(violation.plateNumber, {
          plateNumber: violation.plateNumber,
          firstSeen: violation.createdAt,
          lastSeen: violation.createdAt,
          totalVisits: 0,
          totalViolations: 1,
          imageUrls: violation.imageUrls || [],
        });
      }
    });

    setVehicles(Array.from(vehicleMap.values()));
  }, [visits, violations]);

  const filteredVehicles = vehicles.filter(v =>
    v.plateNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-kufi">إدارة المركبات</h2>
        <p className="text-gray-600 mt-1">
          تجميع تلقائي للمركبات من الزيارات والمخالفات
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="relative">
          <MagnifyingGlass className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="البحث عن مركبة..."
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">إجمالي المركبات</p>
          <p className="text-2xl font-bold text-blue-600">{vehicles.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">بدون مخالفات</p>
          <p className="text-2xl font-bold text-green-600">
            {vehicles.filter(v => v.totalViolations === 0).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600">بمخالفات</p>
          <p className="text-2xl font-bold text-red-600">
            {vehicles.filter(v => v.totalViolations > 0).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">بصور</p>
          <p className="text-2xl font-bold text-purple-600">
            {vehicles.filter(v => v.imageUrls.length > 0).length}
          </p>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg shadow-md border text-center">
            <Car size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد مركبات</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.plateNumber} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold font-kufi">{vehicle.plateNumber}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicle.vehicleType || 'غير محدد'}
                  </p>
                </div>
                <Car size={32} className="text-primary" weight="fill" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">إجمالي الزيارات:</span>
                  <span className="font-semibold">{vehicle.totalVisits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">إجمالي المخالفات:</span>
                  <span className={`font-semibold ${vehicle.totalViolations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {vehicle.totalViolations}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">عدد الصور:</span>
                  <span className="font-semibold">{vehicle.imageUrls.length}</span>
                </div>
              </div>

              <div className="pt-4 border-t text-xs text-gray-500 space-y-1">
                <div>أول ظهور: {formatDateTime(vehicle.firstSeen)}</div>
                <div>آخر ظهور: {formatDateTime(vehicle.lastSeen)}</div>
              </div>

              {vehicle.imageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {vehicle.imageUrls.slice(0, 3).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${vehicle.plateNumber} - ${idx + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
