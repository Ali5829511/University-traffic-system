// ======================================
// نظام إدارة مواقف السيارات والمخالفات
// Type Definitions
// ======================================

/**
 * نوع الزيارة - Visit Record
 */
export interface Visit {
  id: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  cameraId?: string;
  location?: string;
  imageUrl?: string;
  createdAt: string;
}

/**
 * نوع المخالفة - Violation Record
 */
export interface Violation {
  id: string;
  plateNumber: string;
  violationType: string;
  violationDate: string;
  violationTime: string;
  location: string;
  description?: string;
  fine?: number;
  status: 'pending' | 'paid' | 'cancelled';
  imageUrls?: string[];
  cameraId?: string;
  createdAt: string;
}

/**
 * نوع المركبة - Vehicle Record
 */
export interface Vehicle {
  plateNumber: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  totalViolations: number;
  imageUrls: string[];
  vehicleType?: string;
}

/**
 * استجابة Plate Recognizer API
 */
export interface PlateRecognizerResponse {
  results: Array<{
    plate: string;
    region?: {
      code: string;
    };
    vehicle?: {
      type: string;
    };
    confidence?: number;
  }>;
  camera_id?: string;
  timestamp?: string;
}

/**
 * بيانات ParkPow
 */
export interface ParkPowData {
  id: string;
  plate: string;
  timestamp: string;
  imageUrl?: string;
  location?: string;
  cameraId?: string;
}

/**
 * حدث Webhook
 */
export interface WebhookEvent {
  id: string;
  timestamp: string;
  type: 'plate_recognized' | 'violation_detected';
  data: any;
  status: 'pending' | 'processed' | 'failed';
  forwardedToParkPow?: boolean;
}

/**
 * إعدادات FTP
 */
export interface FTPConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  path?: string;
}

/**
 * حالة التكامل - Integration Status
 */
export interface IntegrationStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: string;
  message?: string;
  stats?: {
    totalRequests?: number;
    remainingRequests?: number;
  };
}

/**
 * نوع التقرير - Report Type
 */
export type ReportType = 'violations' | 'visits' | 'vehicles' | 'comprehensive';

/**
 * خيارات التصدير - Export Options
 */
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  dateFrom?: string;
  dateTo?: string;
  includeImages?: boolean;
}
