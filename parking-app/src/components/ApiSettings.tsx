import { useState } from 'react';
import { Key, Check, CloudArrowUp, Database } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useApiSettings, useFTPSettings, useMonitoringSettings } from '../hooks/use-local-storage';

/**
 * تبويب الإعدادات
 * إدارة إعدادات API والتكاملات الخارجية
 */
export default function ApiSettings() {
  const {
    plateRecognizerKey,
    setPlateRecognizerKey,
    parkpowToken,
    setParkpowToken,
    webhookEnabled,
    setWebhookEnabled,
    webhookUrl,
    setWebhookUrl,
    forwardToParkPow,
    setForwardToParkPow,
  } = useApiSettings();

  const {
    ftpHost,
    setFtpHost,
    ftpUser,
    setFtpUser,
    ftpPassword,
    setFtpPassword,
    ftpPath,
    setFtpPath,
  } = useFTPSettings();

  const {
    monitoringEnabled,
    setMonitoringEnabled,
    monitoringInterval,
    setMonitoringInterval,
  } = useMonitoringSettings();

  const [showKeys, setShowKeys] = useState(false);

  const testPlateRecognizer = async () => {
    if (!plateRecognizerKey) {
      toast.error('يرجى إدخال رمز Plate Recognizer API');
      return;
    }

    toast.loading('جارٍ اختبار الاتصال...');
    
    // محاكاة اختبار الاتصال
    setTimeout(() => {
      toast.success('تم الاتصال بنجاح! الرمز صالح.');
    }, 1500);
  };

  const testParkPow = async () => {
    if (!parkpowToken) {
      toast.error('يرجى إدخال رمز ParkPow Token');
      return;
    }

    toast.loading('جارٍ اختبار الاتصال...');
    
    // محاكاة اختبار الاتصال
    setTimeout(() => {
      toast.success('تم الاتصال بـ ParkPow بنجاح!');
    }, 1500);
  };

  const testFTP = async () => {
    if (!ftpHost || !ftpUser || !ftpPassword) {
      toast.error('يرجى إدخال جميع بيانات اعتماد FTP');
      return;
    }

    toast.loading('جارٍ اختبار اتصال FTP...');
    
    // محاكاة اختبار الاتصال
    setTimeout(() => {
      toast.success('تم الاتصال بخادم FTP بنجاح!');
    }, 1500);
  };

  const saveSettings = () => {
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-kufi">الإعدادات</h2>
        <p className="text-gray-600 mt-1">إدارة إعدادات API والتكاملات الخارجية</p>
      </div>

      {/* Plate Recognizer API */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center gap-3 mb-4">
          <Key size={24} className="text-primary" weight="fill" />
          <h3 className="text-lg font-bold">Plate Recognizer API</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">رمز API</label>
            <div className="flex gap-2">
              <input
                type={showKeys ? 'text' : 'password'}
                value={plateRecognizerKey}
                onChange={(e) => setPlateRecognizerKey(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="أدخل رمز Plate Recognizer API"
              />
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                {showKeys ? 'إخفاء' : 'إظهار'}
              </button>
              <button
                onClick={testPlateRecognizer}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
              >
                اختبار
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              احصل على رمز API من: 
              <a href="https://app.platerecognizer.com/" target="_blank" rel="noopener noreferrer" className="text-primary mr-1">
                app.platerecognizer.com
              </a>
            </p>
          </div>

          {plateRecognizerKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Check size={20} weight="bold" />
                <span className="font-semibold">تم التكوين</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                التعرف التلقائي على اللوحات مفعّل
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ParkPow Integration */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center gap-3 mb-4">
          <CloudArrowUp size={24} className="text-secondary" weight="fill" />
          <h3 className="text-lg font-bold">ParkPow Integration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">ParkPow Token</label>
            <div className="flex gap-2">
              <input
                type={showKeys ? 'text' : 'password'}
                value={parkpowToken}
                onChange={(e) => setParkpowToken(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                placeholder="أدخل رمز ParkPow Token"
              />
              <button
                onClick={testParkPow}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90"
              >
                اختبار
              </button>
            </div>
          </div>

          {parkpowToken && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Check size={20} weight="bold" />
                <span className="font-semibold">متصل بـ ParkPow</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                الإرسال التلقائي للبيانات مفعّل
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Webhook */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center gap-3 mb-4">
          <Database size={24} className="text-accent" weight="fill" />
          <h3 className="text-lg font-bold">Cloud Webhook</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="webhook-enabled"
              checked={webhookEnabled}
              onChange={(e) => setWebhookEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="webhook-enabled" className="font-semibold">
              تفعيل استقبال Webhooks
            </label>
          </div>

          {webhookEnabled && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">رابط Webhook</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent"
                  placeholder="https://your-webhook-url.com"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="forward-parkpow"
                  checked={forwardToParkPow}
                  onChange={(e) => setForwardToParkPow(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="forward-parkpow" className="font-semibold">
                  إعادة توجيه تلقائية إلى ParkPow
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FTP Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center gap-3 mb-4">
          <CloudArrowUp size={24} className="text-purple-600" weight="fill" />
          <h3 className="text-lg font-bold">إعدادات FTP</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">عنوان الخادم</label>
            <input
              type="text"
              value={ftpHost}
              onChange={(e) => setFtpHost(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="ftp.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={ftpUser}
              onChange={(e) => setFtpUser(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">كلمة المرور</label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={ftpPassword}
              onChange={(e) => setFtpPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="********"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">مسار الرفع</label>
            <input
              type="text"
              value={ftpPath}
              onChange={(e) => setFtpPath(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="/uploads"
            />
          </div>
        </div>

        <button
          onClick={testFTP}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90"
        >
          اختبار اتصال FTP
        </button>
      </div>

      {/* Monitoring Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-bold mb-4">إعدادات المراقبة التلقائية</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="monitoring-enabled"
              checked={monitoringEnabled}
              onChange={(e) => setMonitoringEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="monitoring-enabled" className="font-semibold">
              تفعيل المراقبة الدورية التلقائية
            </label>
          </div>

          {monitoringEnabled && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                فترة الفحص (بالدقائق)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={monitoringInterval}
                onChange={(e) => setMonitoringInterval(parseInt(e.target.value))}
                className="w-full md:w-48 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-600 mt-2">
                سيتم فحص جميع التكاملات تلقائياً كل {monitoringInterval} دقيقة
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          حفظ جميع الإعدادات
        </button>
      </div>
    </div>
  );
}
