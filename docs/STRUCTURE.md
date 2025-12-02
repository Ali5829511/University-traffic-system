# 📁 Project Structure Documentation

## نظام إدارة المرور الجامعي - University Traffic Management System

This document explains the new organized structure of the project.

---

## 🏗️ Directory Structure

```
/
├── src/                        # Source code directory
│   ├── server/                 # Backend server code
│   │   ├── config/            # Configuration files
│   │   │   └── db-config.js   # Database connection configuration
│   │   ├── routes/            # API route definitions (future)
│   │   ├── middleware/        # Express middleware (future)
│   │   ├── controllers/       # Route controllers (future)
│   │   ├── utils/             # Server-side utilities
│   │   │   ├── advanced_export.js
│   │   │   └── vehicle_database.js
│   │   └── server.js          # Main Express server
│   │
│   ├── public/                 # Frontend static files
│   │   ├── pages/             # HTML pages (31 files)
│   │   │   ├── index.html     # Landing/Login page
│   │   │   ├── home.html      # Main dashboard
│   │   │   ├── traffic_dashboard.html
│   │   │   ├── building_monitoring.html
│   │   │   ├── violations_report.html
│   │   │   └── ... (28 more pages)
│   │   │
│   │   ├── js/                # Client-side JavaScript
│   │   │   ├── auth.js        # Authentication logic
│   │   │   ├── database.js    # Local database operations
│   │   │   ├── database-api.js # API client
│   │   │   └── residential_units_data.js
│   │   │
│   │   ├── css/               # Stylesheets (future)
│   │   └── assets/            # Static assets (images, icons, etc.)
│   │       ├── index-11xRr3P_.js
│   │       ├── index-BrWhr3HC.css
│   │       └── logo.svg
│   │
│   └── scripts/                # Utility scripts
│       ├── setup-database.js   # Database initialization
│       ├── import-stickers.js  # Import stickers from Excel
│       ├── import-all-data.js  # Import all data from Excel
│       └── real_data_loader.js # Load real data
│
├── tests/                      # Test files
│   └── test-api.js            # API tests
│
├── docs/                       # Documentation
│   ├── API_SETUP.md
│   ├── CLOUD_DATABASE_GUIDE.md
│   ├── SECURITY.md
│   ├── SYSTEM_MAP.md
│   └── ... (14 more docs)
│
├── data/                       # Data directory
│   ├── images/                # Uploaded images
│   └── results/               # Generated results
│
├── reports/                    # Generated reports
│   └── templates/
│
├── jobs/                       # Background jobs
│   └── import_visits_with_images_and_pdf.js
│
├── uploads/                    # User uploads
│
├── deep-license-plate-recognition/  # Plate recognition integration
├── parking-app/                # Parking management app
│
├── index.js                    # Main entry point
├── package.json               # NPM configuration
├── .env.example              # Environment variables example
├── .gitignore                # Git ignore rules
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Docker Compose configuration
├── render.yaml               # Render.com deployment config
├── README.md                 # Project documentation
│
└── [Data files]              # JSON data files
    ├── buildings_data.json
    ├── parking_data.json
    ├── residential_units_data.json
    ├── residents_data.json
    └── stickers_data.json
```

---

## 📋 Key Changes

### Before Restructure:
- ❌ All HTML files in root (31 files)
- ❌ JavaScript files scattered (11 in root, 2 in /js)
- ❌ Backend and frontend mixed together
- ❌ Documentation files in root
- ❌ Hard to navigate and maintain

### After Restructure:
- ✅ Organized src/ directory
- ✅ Clear separation: server/ and public/
- ✅ All HTML pages in src/public/pages/
- ✅ Client JS in src/public/js/
- ✅ Server code in src/server/
- ✅ Scripts in src/scripts/
- ✅ Documentation in docs/
- ✅ Tests in tests/
- ✅ Easy to navigate and maintain

---

## 🚀 How to Use

### Starting the Server

```bash
# Install dependencies
npm install

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

The server will start on `http://localhost:3000`

### Accessing Pages

All HTML pages are now served from `/pages/` URL path:

- Landing page: `http://localhost:3000/pages/index.html`
- Home dashboard: `http://localhost:3000/pages/home.html`
- Traffic dashboard: `http://localhost:3000/pages/traffic_dashboard.html`
- etc.

### Running Scripts

```bash
# Setup database
npm run setup

# Import stickers
npm run import-stickers

# Import all data
npm run import-all

# Run tests
npm test
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL=true
NODE_ENV=production
PORT=3000
```

---

## 📦 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node index.js` | Start the server |
| `dev` | `nodemon index.js` | Development mode with auto-reload |
| `setup` | `node src/scripts/setup-database.js` | Initialize database |
| `test` | `node tests/test-api.js` | Run API tests |
| `import-stickers` | `node src/scripts/import-stickers.js` | Import stickers data |
| `import-all` | `node src/scripts/import-all-data.js` | Import all data |
| `import-visits` | `node jobs/import_visits_with_images_and_pdf.js` | Import visits |

---

## 🔍 Finding Files

### Common Tasks:

1. **Modify a page?** → Look in `src/public/pages/`
2. **Update authentication?** → Edit `src/public/js/auth.js`
3. **Change server logic?** → Edit `src/server/server.js`
4. **Update database config?** → Edit `src/server/config/db-config.js`
5. **Add new script?** → Add to `src/scripts/`
6. **Add documentation?** → Add to `docs/`
7. **Add tests?** → Add to `tests/`

---

## 🎯 Benefits of New Structure

1. **Better Organization**: Clear separation of concerns
2. **Easier Maintenance**: Find files quickly
3. **Scalability**: Easy to add new features
4. **Team Collaboration**: Clear structure for multiple developers
5. **Modern Standards**: Follows Node.js/Express best practices
6. **Docker Ready**: Clean structure for containerization
7. **CI/CD Friendly**: Easy to automate builds and deployments

---

## 📚 Additional Documentation

- **System Overview**: [docs/SYSTEM_MAP.md](docs/SYSTEM_MAP.md)
- **Security Guide**: [docs/SECURITY.md](docs/SECURITY.md)
- **API Setup**: [docs/API_SETUP.md](docs/API_SETUP.md)
- **Cloud Database**: [docs/CLOUD_DATABASE_GUIDE.md](docs/CLOUD_DATABASE_GUIDE.md)
- **Deployment**: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

---

## 🔄 Migration Notes

All file paths have been updated in:
- ✅ HTML pages (script and asset references)
- ✅ Server configuration
- ✅ Import scripts
- ✅ Job scripts
- ✅ Test files
- ✅ Package.json scripts

The system is fully functional with the new structure!

---

Last Updated: 2025-12-01
Version: 2.0.0 (Restructured)
