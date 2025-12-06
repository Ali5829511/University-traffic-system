#!/bin/bash

# ============================================
# Netlify Local Test Script
# سكريبت اختبار Netlify المحلي
# ============================================

echo "============================================"
echo "🚀 اختبار تكوين Netlify المحلي"
echo "🚀 Testing Netlify Configuration Locally"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت / Node.js is not installed"
    echo "📥 تثبيت من: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version) مثبت / installed"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت المكتبات / Installing dependencies..."
    npm install
    echo ""
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI غير مثبت / Netlify CLI not installed"
    echo "📥 تثبيت Netlify CLI..."
    npm install -g netlify-cli
    echo ""
fi

echo "✅ Netlify CLI مثبت / installed"
echo ""

# Check configuration files
echo "🔍 التحقق من ملفات التكوين / Checking configuration files..."
echo ""

if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml موجود / exists"
else
    echo "❌ netlify.toml غير موجود / missing"
    exit 1
fi

if [ -f "src/public/_redirects" ]; then
    echo "✅ _redirects موجود / exists"
else
    echo "⚠️  _redirects غير موجود / missing (اختياري / optional)"
fi

if [ -d "netlify/functions" ]; then
    echo "✅ netlify/functions موجود / exists"
    echo "   وظائف متاحة / Available functions:"
    ls -1 netlify/functions/*.js 2>/dev/null | xargs -n1 basename | sed 's/\.js$//' | sed 's/^/   - /'
else
    echo "❌ netlify/functions غير موجود / missing"
fi

echo ""
echo "============================================"
echo "🌐 بدء خادم Netlify المحلي"
echo "🌐 Starting Netlify Dev Server"
echo "============================================"
echo ""
echo "📍 الموقع سيكون متاحاً على:"
echo "📍 Site will be available at:"
echo "   http://localhost:8888"
echo ""
echo "📍 الوظائف متاحة على:"
echo "📍 Functions available at:"
echo "   http://localhost:8888/.netlify/functions/[function-name]"
echo ""
echo "⏸️  اضغط Ctrl+C للإيقاف / Press Ctrl+C to stop"
echo ""
echo "============================================"
echo ""

# Start Netlify dev server
netlify dev
