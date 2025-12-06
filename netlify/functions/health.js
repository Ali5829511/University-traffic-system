/**
 * Netlify Function - Health Check
 * وظيفة Netlify - فحص الصحة
 * 
 * Simple health check endpoint to verify the system is running
 * نقطة نهاية بسيطة للتحقق من أن النظام يعمل
 */

exports.handler = async (event, context) => {
    // Set CORS headers / تعيين ترويسات CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests / معالجة طلبات الاختبار المسبق
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Health check response / استجابة فحص الصحة
        const response = {
            success: true,
            message: 'University Traffic System is running / نظام إدارة المرور الجامعي يعمل',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '5.0'
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Health check error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Health check failed / فشل فحص الصحة',
                error: error.message
            })
        };
    }
};
