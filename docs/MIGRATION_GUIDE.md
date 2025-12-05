# 🔄 Migration Guide - System Restructure

## دليل الانتقال للنظام المُعاد هيكلته

This guide helps developers understand what changed and how to work with the new structure.

---

## 📋 What Changed?

### Old Structure (Before):
```
/
├── *.html (31 HTML files in root)
├── *.js (11 JS files in root)
├── js/
│   ├── auth.js
│   └── database.js
├── assets/ (static files)
└── server.js
```

### New Structure (After):
```
/
├── index.js (new entry point)
├── src/
│   ├── server/
│   │   ├── config/
│   │   │   └── db-config.js
│   │   ├── server.js
│   │   └── utils/
│   ├── public/
│   │   ├── pages/ (all HTML files)
│   │   ├── js/ (client-side JS)
│   │   ├── css/
│   │   └── assets/
│   └── scripts/ (utility scripts)
├── tests/
└── docs/
```

---

## 🔍 File Location Changes

### Backend Files

| Old Location | New Location | Purpose |
|--------------|--------------|---------|
| `server.js` | `src/server/server.js` | Main Express server |
| `db-config.js` | `src/server/config/db-config.js` | Database configuration |
| `database-api.js` | `src/public/js/database-api.js` | Client-side DB API |
| `advanced_export.js` | `src/server/utils/advanced_export.js` | Export utilities |
| `vehicle_database.js` | `src/server/utils/vehicle_database.js` | Vehicle utilities |

### Frontend Files

| Old Location | New Location |
|--------------|--------------|
| `index.html` | `src/public/pages/index.html` |
| `home.html` | `src/public/pages/home.html` |
| `*.html` (all) | `src/public/pages/*.html` |
| `js/auth.js` | `src/public/js/auth.js` |
| `js/database.js` | `src/public/js/database.js` |
| `assets/*` | `src/public/assets/*` |

### Scripts

| Old Location | New Location |
|--------------|--------------|
| `setup-database.js` | `src/scripts/setup-database.js` |
| `import-stickers.js` | `src/scripts/import-stickers.js` |
| `import-all-data.js` | `src/scripts/import-all-data.js` |
| `real_data_loader.js` | `src/scripts/real_data_loader.js` |
| `test-api.js` | `tests/test-api.js` |

### Documentation

| Old Location | New Location |
|--------------|--------------|
| `*.md` (most docs) | `docs/*.md` |
| `README.md` | `README.md` (stays in root) |

---

## 🔧 Code Changes Required

### 1. Import/Require Statements

#### Backend (server-side):
```javascript
// ❌ OLD
const db = require('./db-config');

// ✅ NEW
const db = require('./config/db-config');
```

```javascript
// ❌ OLD
const visitsImporter = require('./jobs/import_visits_with_images_and_pdf');

// ✅ NEW
const visitsImporter = require('../../jobs/import_visits_with_images_and_pdf');
```

#### Scripts:
```javascript
// ❌ OLD (in scripts)
const db = require('./db-config');

// ✅ NEW (in src/scripts/)
const db = require('../server/config/db-config');
```

```javascript
// ❌ OLD
const filePath = path.join(__dirname, 'data.json');

// ✅ NEW
const filePath = path.join(__dirname, '../../data.json');
```

### 2. HTML References

All HTML files now use absolute paths:

```html
<!-- ❌ OLD -->
<script src="js/auth.js"></script>
<script src="js/database.js"></script>

<!-- ✅ NEW -->
<script src="/js/auth.js"></script>
<script src="/js/database.js"></script>
```

```html
<!-- ❌ OLD -->
<img src="assets/logo.png">

<!-- ✅ NEW -->
<img src="/assets/logo.png">
```

### 3. Express Static Files

```javascript
// ❌ OLD
app.use(express.static('.'));

// ✅ NEW
app.use(express.static(path.join(__dirname, '../public')));
```

### 4. URL Paths

When accessing pages:

```
❌ OLD: http://localhost:3000/index.html
✅ NEW: http://localhost:3000/pages/index.html

❌ OLD: http://localhost:3000/home.html
✅ NEW: http://localhost:3000/pages/home.html
```

Static assets still work directly:
```
✅ http://localhost:3000/js/auth.js
✅ http://localhost:3000/assets/logo.png
```

---

## 🚀 NPM Scripts Changes

### Before:
```json
{
  "start": "node server.js",
  "setup": "node setup-database.js",
  "test": "node test-api.js"
}
```

### After:
```json
{
  "start": "node index.js",
  "setup": "node src/scripts/setup-database.js",
  "test": "node tests/test-api.js"
}
```

**Important:** Use `npm start`, `npm run setup`, etc. - these work correctly!

---

## 🎯 Common Tasks After Migration

### Task 1: Add a New Page

**Before:**
```bash
# Create file in root
touch my-new-page.html
```

**After:**
```bash
# Create file in src/public/pages/
touch src/public/pages/my-new-page.html
```

Access: `http://localhost:3000/pages/my-new-page.html`

### Task 2: Add Client-Side JavaScript

**Before:**
```bash
touch my-script.js  # Root directory
```

**After:**
```bash
touch src/public/js/my-script.js
```

Reference in HTML:
```html
<script src="/js/my-script.js"></script>
```

### Task 3: Add Server-Side Utilities

**Before:**
```bash
touch my-utility.js  # Root directory
```

**After:**
```bash
touch src/server/utils/my-utility.js
```

Use in server:
```javascript
const myUtil = require('./utils/my-utility');
```

### Task 4: Add a New API Route

```bash
# Create route file
touch src/server/routes/my-routes.js

# Import in server.js
const myRoutes = require('./routes/my-routes');
app.use('/api/my-endpoint', myRoutes);
```

### Task 5: Add Tests

```bash
touch tests/my-test.js
```

Run: `npm test`

### Task 6: Add Documentation

```bash
touch docs/MY_FEATURE.md
```

Link from README:
```markdown
See [My Feature Guide](docs/MY_FEATURE.md)
```

---

## ✅ Verification Checklist

After migrating or pulling the new structure, verify:

- [ ] `npm install` completes successfully
- [ ] `npm start` starts the server on port 3000
- [ ] Can access `http://localhost:3000/pages/index.html`
- [ ] Can access `http://localhost:3000/api/health`
- [ ] JavaScript files load: `/js/auth.js`, `/js/database.js`
- [ ] Static assets load: `/assets/*`
- [ ] All documentation links work in README.md
- [ ] Tests run with `npm test`

---

## 🐛 Troubleshooting

### Problem: "Cannot find module"

**Solution:** Check your require/import paths. Use relative paths from the current file:

```javascript
// From src/server/server.js
require('./config/db-config')  // ✅

// From src/scripts/setup.js
require('../server/config/db-config')  // ✅
```

### Problem: Pages return 404

**Solution:** Pages are now at `/pages/` prefix:

```
http://localhost:3000/pages/index.html  ✅
http://localhost:3000/index.html         ❌
```

### Problem: JavaScript not loading

**Solution:** Use absolute paths in HTML:

```html
<script src="/js/auth.js"></script>  ✅
<script src="js/auth.js"></script>   ❌
```

### Problem: Assets not loading

**Solution:** Use absolute paths:

```html
<img src="/assets/logo.png">  ✅
<img src="assets/logo.png">   ❌
```

---

## 📚 Additional Resources

- [Structure Documentation](STRUCTURE.md)
- [Main README](../README.md)
- [System Map](SYSTEM_MAP.md)
- [Security Guide](SECURITY.md)

---

## 🔄 Phase 2 Migration - Data Files Organization (Dec 2025)

### What Changed in Phase 2?

Phase 2 moved data files and database schemas from root to organized directories.

### Data Files Location Changes

| Old Location | New Location | Size |
|--------------|--------------|------|
| `schema.postgres.sql` | `database/schemas/schema.postgres.sql` | 12 KB |
| `schema.sql` | `database/schemas/schema.sql` | 28 KB |
| `sample_data.sql` | `database/seeds/sample_data.sql` | 29 KB |
| `update_residential_units.sql` | `database/schemas/migrations/update_residential_units.sql` | 3 KB |
| `stickers_data.json` | `data/json/stickers_data.json` | 1.2 MB |
| `parking_data.json` | `data/json/parking_data.json` | 562 KB |
| `residents_data.json` | `data/json/residents_data.json` | 405 KB |
| `residential_units_data.json` | `data/json/residential_units_data.json` | 353 KB |
| `buildings_data.json` | `data/json/buildings_data.json` | 59 KB |
| `plate_recognizer_config.json` | `data/config/plate_recognizer_config.json` | 575 B |
| `real_data.json` | `data/config/real_data.json` | 91 B |

### Code Changes Required

The following files were automatically updated with new paths:

1. **src/server/config/db-config.js**
   ```javascript
   // Before
   const schemaPath = path.join(__dirname, 'schema.postgres.sql');
   
   // After
   const schemaPath = path.join(__dirname, '../../../database/schemas/schema.postgres.sql');
   ```

2. **src/scripts/import-stickers.js**
   ```javascript
   // Before
   const outputFilePath = path.join(__dirname, '../../stickers_data.json');
   
   // After
   const outputFilePath = path.join(__dirname, '../../data/json/stickers_data.json');
   ```

3. **src/scripts/import-all-data.js**
   - Updated paths for all 5 data JSON files (stickers, parking, residential_units, residents, buildings)

4. **src/scripts/real_data_loader.js**
   ```javascript
   // Before
   this.dataFile = '../data/real_data.json';
   
   // After
   this.dataFile = '../data/config/real_data.json';
   ```

### New Directory Structure (Phase 2)

```
database/
├── schemas/
│   ├── schema.postgres.sql      # PostgreSQL schema
│   ├── schema.sql               # Generic SQL schema
│   └── migrations/              # Migration scripts
│       └── update_residential_units.sql
└── seeds/
    └── sample_data.sql          # Sample data

data/
├── json/                        # Data files
│   ├── buildings_data.json
│   ├── parking_data.json
│   ├── residential_units_data.json
│   ├── residents_data.json
│   └── stickers_data.json
└── config/                      # Configuration
    ├── plate_recognizer_config.json
    └── real_data.json
```

### If You're Working on an Older Branch

If you have changes in an old branch before Phase 2:

```bash
# 1. Commit your current work
git add .
git commit -m "WIP: my changes"

# 2. Fetch latest changes
git fetch origin

# 3. Rebase onto new structure (or merge)
git rebase origin/main  # or git merge origin/main

# 4. If there are conflicts with moved files:
# - Update your file paths to use new locations
# - Reference database/schemas/ instead of root
# - Reference data/json/ instead of root
```

### Phase 2 Benefits

- ✅ Clean root directory (only package.json and config files)
- ✅ Organized database files in database/ directory
- ✅ Clear separation of data files in data/json/
- ✅ Configuration files grouped in data/config/
- ✅ Easier to maintain and scale
- ✅ Git history preserved for all moved files

---

## 💡 Benefits of New Structure

1. **Better Organization**: Clear separation between frontend, backend, tests, docs
2. **Scalability**: Easy to add new features without cluttering root
3. **Industry Standard**: Follows Node.js/Express best practices
4. **Easier Onboarding**: New developers can understand structure quickly
5. **Better Tooling**: IDEs work better with organized structure
6. **Deployment Ready**: Clean structure for Docker, cloud platforms
7. **Maintenance**: Easier to find and modify files

---

## 🤝 Need Help?

If you encounter issues:
1. Check this migration guide
2. Review [STRUCTURE.md](STRUCTURE.md)
3. Verify file paths match new structure
4. Check console for specific error messages
5. Open an issue with details

---

Last Updated: 2025-12-01
Version: 2.0.0 (Restructured)
