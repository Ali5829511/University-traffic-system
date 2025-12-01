/**
 * University Traffic Management System - Entry Point
 * نظام إدارة المرور الجامعي - نقطة الدخول الرئيسية
 * 
 * This is the main entry point that starts the server.
 */

// Load environment variables
require('dotenv').config();

// Start the server
require('./src/server/server');
