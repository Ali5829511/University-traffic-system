import { useState, useCallback } from 'react';

/**
 * Hook مخصص للتخزين المحلي - مماثل لـ useKV
 * يوفر واجهة سهلة للتعامل مع localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // الحصول على القيمة المخزنة أو استخدام القيمة الافتراضية
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // حفظ القيمة في localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * Hook للحصول على جميع الزيارات
 */
export function useVisits() {
  return useLocalStorage('visits', []);
}

/**
 * Hook للحصول على جميع المخالفات
 */
export function useViolations() {
  return useLocalStorage('violations', []);
}

/**
 * Hook للحصول على جميع المركبات
 */
export function useVehicles() {
  return useLocalStorage('vehicles', []);
}

/**
 * Hook لإعدادات API
 */
export function useApiSettings() {
  const [plateRecognizerKey, setPlateRecognizerKey] = useLocalStorage('plateRecognizerApiKey', '');
  const [parkpowToken, setParkpowToken] = useLocalStorage('parkpowToken', '');
  const [webhookEnabled, setWebhookEnabled] = useLocalStorage('webhookEnabled', false);
  const [webhookUrl, setWebhookUrl] = useLocalStorage('webhookUrl', '');
  const [forwardToParkPow, setForwardToParkPow] = useLocalStorage('forwardToParkPow', false);
  
  return {
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
  };
}

/**
 * Hook لإعدادات FTP
 */
export function useFTPSettings() {
  const [ftpHost, setFtpHost] = useLocalStorage('ftpHost', '');
  const [ftpUser, setFtpUser] = useLocalStorage('ftpUser', '');
  const [ftpPassword, setFtpPassword] = useLocalStorage('ftpPassword', '');
  const [ftpPath, setFtpPath] = useLocalStorage('ftpPath', '/uploads');
  
  return {
    ftpHost,
    setFtpHost,
    ftpUser,
    setFtpUser,
    ftpPassword,
    setFtpPassword,
    ftpPath,
    setFtpPath,
  };
}

/**
 * Hook لإعدادات المراقبة
 */
export function useMonitoringSettings() {
  const [monitoringEnabled, setMonitoringEnabled] = useLocalStorage('monitoringEnabled', false);
  const [monitoringInterval, setMonitoringInterval] = useLocalStorage('monitoringInterval', 5);
  
  return {
    monitoringEnabled,
    setMonitoringEnabled,
    monitoringInterval,
    setMonitoringInterval,
  };
}
