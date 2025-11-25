import { useState } from 'react';
import { Car, FileText, Database, Gear, MapPin } from '@phosphor-icons/react';
import { Toaster } from 'sonner';

// سيتم إنشاء هذه المكونات
import ViolationsTab from './components/ViolationsTab';
import VisitsTab from './components/VisitsTab';
import VehiclesTab from './components/VehiclesTab';
import ReportsTab from './components/ReportsTab';
import ApiSettings from './components/ApiSettings';

/**
 * المكون الرئيسي للتطبيق
 * نظام إدارة مواقف السيارات والمخالفات
 */
function App() {
  const [activeTab, setActiveTab] = useState('violations');

  const tabs = [
    { id: 'violations', name: 'المخالفات', icon: FileText },
    { id: 'visits', name: 'الزيارات', icon: MapPin },
    { id: 'vehicles', name: 'المركبات', icon: Car },
    { id: 'reports', name: 'التقارير', icon: Database },
    { id: 'settings', name: 'الإعدادات', icon: Gear },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold font-kufi">
            جامعة الإمام محمد بن سعود الإسلامية
          </h1>
          <p className="text-sm mt-1 opacity-90">
            نظام إدارة مواقف السيارات والمخالفات المرورية
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-semibold transition-colors
                    border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={20} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'violations' && <ViolationsTab />}
        {activeTab === 'visits' && <VisitsTab />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'settings' && <ApiSettings />}
      </main>

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors dir="rtl" />
    </div>
  );
}

export default App;
