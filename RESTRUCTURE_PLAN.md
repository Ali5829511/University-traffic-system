# 📋 Repository Restructure Plan

## خطة إعادة هيكلة المستودع - Repository Restructuring Plan

**Date:** 2025-12-05  
**Version:** Phase 2 - Data Files Organization  
**Status:** 📝 Proposed - Awaiting Approval

---

## 🎯 Objective

This document outlines a plan for Phase 2 of the repository restructure: organizing data files, configuration files, and database schemas that are currently in the root directory.

**Phase 1 (Completed):** Source code organization (src/, docs/, tests/)  
**Phase 2 (This Plan):** Data files, SQL schemas, and configuration files organization

---

## 📊 Current Issues

### Files in Root Directory (Need Organization)

#### Large Data Files (Tracked in Git)
- `stickers_data.json` (1.2 MB) - Contains parking sticker data
- `parking_data.json` (562 KB) - Parking records
- `residents_data.json` (405 KB) - Resident information (sensitive data)
- `residential_units_data.json` (353 KB) - Housing unit data
- `buildings_data.json` (59 KB) - Building information

#### Database Schema Files
- `schema.postgres.sql` (12 KB) - PostgreSQL schema definition
- `schema.sql` (28 KB) - Generic SQL schema
- `sample_data.sql` (29 KB) - Sample data for development/testing
- `update_residential_units.sql` (3.1 KB) - Schema update script

#### Configuration Files
- `plate_recognizer_config.json` (575 bytes) - Plate Recognizer API config
- `real_data.json` (91 bytes) - Real data flag/config

---

## 🏗️ Proposed Structure

```
University-traffic-system/
├── src/                              # Source code (existing)
│   ├── server/                       # Backend server
│   ├── public/                       # Frontend files
│   └── scripts/                      # Utility scripts
│
├── database/                         # 🆕 Database files
│   ├── schemas/                      # SQL schema definitions
│   │   ├── schema.postgres.sql      # PostgreSQL schema (MOVE)
│   │   ├── schema.sql               # Generic SQL schema (MOVE)
│   │   └── migrations/              # Future: migration scripts
│   │       └── update_residential_units.sql (MOVE)
│   │
│   └── seeds/                        # Sample/seed data
│       └── sample_data.sql          # Sample data (MOVE)
│
├── data/                             # Data directory (existing)
│   ├── json/                         # 🆕 JSON data files
│   │   ├── buildings_data.json      # (MOVE)
│   │   ├── parking_data.json        # (MOVE)
│   │   ├── residential_units_data.json (MOVE)
│   │   ├── residents_data.json      # (MOVE) - Sensitive!
│   │   └── stickers_data.json       # (MOVE)
│   │
│   ├── config/                       # 🆕 Configuration files
│   │   ├── plate_recognizer_config.json (MOVE)
│   │   └── real_data.json           # (MOVE)
│   │
│   ├── images/                       # (existing) Uploaded images
│   └── results/                      # (existing) Generated results
│
├── docs/                             # Documentation (existing)
├── tests/                            # Test files (existing)
├── jobs/                             # Background jobs (existing)
├── reports/                          # Generated reports (existing)
│
├── index.js                          # Main entry point
├── package.json                      # NPM configuration
├── README.md                         # Project documentation
├── .env.example                      # Environment variables template
└── .gitignore                        # Git ignore rules
```

---

## 🚨 Important Considerations

### Large Files in Git History

The following large JSON files are currently tracked in git history:
- `stickers_data.json` (1.2 MB)
- `parking_data.json` (562 KB)
- `residents_data.json` (405 KB) ⚠️ Contains sensitive personal data
- `residential_units_data.json` (353 KB)

#### ⚠️ **WARNING: These files contain sensitive data (1,057+ residents)**

### Recommended Approaches

#### Option 1: Keep in Git with `.gitattributes` (Simplest)
Move files to `data/json/` and continue tracking them. Good for small teams with controlled access.

**Pros:**
- Simple to implement
- Preserves full history
- No additional infrastructure needed

**Cons:**
- Repository size increases over time
- Every clone downloads all historical versions
- Not ideal for truly large datasets

#### Option 2: Git LFS (Recommended for Large Files)
Use Git Large File Storage for files over 500 KB.

**Pros:**
- Efficient storage and transfer
- Git-like workflow
- Better for large binary files

**Cons:**
- Requires Git LFS setup
- Additional complexity
- May have storage/bandwidth costs

**Implementation:**
```bash
# Install Git LFS (if not installed)
git lfs install

# Track large JSON files
git lfs track "data/json/*.json"
git lfs track "*.json" --lockable

# Add .gitattributes
git add .gitattributes
git commit -m "Configure Git LFS for large JSON files"
```

#### Option 3: External Storage + .gitignore (Most Secure)
Move sensitive data files to external storage (cloud database, S3, etc.) and exclude from git.

**Pros:**
- Smallest repository size
- Best security for sensitive data
- True separation of code and data

**Cons:**
- Requires external infrastructure
- More complex setup process
- Need deployment scripts to fetch data

**Implementation:**
```bash
# Add to .gitignore
echo "data/json/*.json" >> .gitignore
echo "!data/json/.gitkeep" >> .gitignore

# Document external data sources in README
```

---

## 📝 Git Commands to Apply Restructure

### Prerequisites

```bash
# Ensure working directory is clean
git status

# Create backup branch (safety measure)
git branch backup-before-restructure

# Ensure you're on the correct branch
git checkout restructure/files-and-folders-2025-12-05
```

### Step 1: Create New Directories

```bash
# Create database directory structure
mkdir -p database/schemas
mkdir -p database/schemas/migrations
mkdir -p database/seeds

# Create data subdirectories
mkdir -p data/json
mkdir -p data/config

# Create .gitkeep files to preserve empty directories
touch database/schemas/migrations/.gitkeep
```

### Step 2: Move SQL Schema Files

```bash
# Move SQL schema files to database/schemas/
git mv schema.postgres.sql database/schemas/
git mv schema.sql database/schemas/
git mv sample_data.sql database/seeds/

# Move migration scripts
git mv update_residential_units.sql database/schemas/migrations/
```

### Step 3: Move JSON Data Files

```bash
# Move large JSON data files to data/json/
git mv buildings_data.json data/json/
git mv parking_data.json data/json/
git mv residential_units_data.json data/json/
git mv residents_data.json data/json/
git mv stickers_data.json data/json/

# Move configuration JSON files to data/config/
git mv plate_recognizer_config.json data/config/
git mv real_data.json data/config/
```

### Step 4: Update File References

**Files that may need path updates:**

1. **Server configuration** (`src/server/config/db-config.js`)
   - May reference SQL schema files
   
2. **Setup scripts** (`src/scripts/setup-database.js`, `src/scripts/import-*.js`)
   - Reference data JSON files
   - Reference SQL schema files

3. **Documentation** (`README.md`, `docs/*.md`)
   - Update file paths in documentation

**Path Update Examples:**

```javascript
// Before:
const schemaPath = path.join(__dirname, '../../schema.postgres.sql');
const dataPath = path.join(__dirname, '../../residents_data.json');

// After:
const schemaPath = path.join(__dirname, '../../database/schemas/schema.postgres.sql');
const dataPath = path.join(__dirname, '../../data/json/residents_data.json');
```

```javascript
// Before:
const configPath = './plate_recognizer_config.json';

// After:
const configPath = './data/config/plate_recognizer_config.json';
```

### Step 5: Commit Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "chore: Reorganize data files and database schemas

- Move SQL schemas to database/schemas/
- Move migration scripts to database/schemas/migrations/
- Move seed data to database/seeds/
- Move JSON data files to data/json/
- Move config files to data/config/
- Update file path references in code
- Preserve git history for all moved files"

# Push changes
git push origin restructure/files-and-folders-2025-12-05
```

---

## 🔄 Path Reference Updates Required

### Files to Update After Move

| File | What to Update | Priority |
|------|---------------|----------|
| `src/scripts/setup-database.js` | SQL schema paths | 🔴 High |
| `src/scripts/import-stickers.js` | Data file paths | 🔴 High |
| `src/scripts/import-all-data.js` | Data file paths | 🔴 High |
| `src/scripts/real_data_loader.js` | `real_data.json` path | 🔴 High |
| `src/server/server.js` | Config file paths | 🟡 Medium |
| `README.md` | Documentation paths | 🟢 Low |
| `docs/STRUCTURE.md` | Structure documentation | 🟢 Low |

### Search and Replace Patterns

```bash
# Find all references to moved files (for verification)
grep -r "buildings_data.json" --exclude-dir=node_modules --exclude-dir=.git
grep -r "schema.postgres.sql" --exclude-dir=node_modules --exclude-dir=.git
grep -r "plate_recognizer_config.json" --exclude-dir=node_modules --exclude-dir=.git
```

---

## ✅ Testing Checklist

After applying the restructure, verify:

- [ ] **Server Startup**
  ```bash
  npm start
  # Server should start without path errors
  ```

- [ ] **Database Setup**
  ```bash
  npm run setup
  # Should find and load schema files correctly
  ```

- [ ] **Data Import Scripts**
  ```bash
  node src/scripts/import-all-data.js
  # Should find and import data files correctly
  ```

- [ ] **Path Resolution**
  ```bash
  # Test that all file paths resolve correctly
  node -e "console.log(require('./data/config/plate_recognizer_config.json'))"
  ```

- [ ] **Documentation**
  - Verify all documentation links work
  - Update file paths in README.md
  - Update STRUCTURE.md with new paths

- [ ] **Git History**
  ```bash
  # Verify git history is preserved for moved files
  git log --follow data/json/stickers_data.json
  ```

---

## 🔒 Security Considerations

### Sensitive Data Files

The following files contain sensitive personal information:
- `residents_data.json` (405 KB) - Contains names, emails, phone numbers, etc.

**Recommendations:**

1. **Immediate:** Move to `data/json/` (this restructure)
2. **Short-term:** Consider encrypting sensitive fields
3. **Long-term:** Move to secure external storage (database, encrypted S3, etc.)

### Best Practices

- ✅ Never commit credentials or API keys
- ✅ Use `.env` for sensitive configuration
- ✅ Add `data/json/*.json` to `.gitignore` if moving to external storage
- ✅ Implement access controls in production
- ✅ Regular security audits of data access patterns

---

## 📖 Documentation Updates

After completing the restructure, update:

1. **README.md**
   - Update project structure section
   - Update file paths in quick start guide

2. **docs/STRUCTURE.md**
   - Add `database/` directory explanation
   - Document `data/json/` and `data/config/` structure

3. **docs/MIGRATION_GUIDE.md**
   - Add Phase 2 migration notes
   - Document path changes for developers

4. **docs/QUICK_START_GUIDE.md**
   - Update setup instructions with new paths

---

## 🚀 Rollback Plan

If issues occur after restructure:

```bash
# Option 1: Revert the commit
git revert HEAD
git push origin restructure/files-and-folders-2025-12-05

# Option 2: Reset to backup branch
git reset --hard backup-before-restructure
git push --force origin restructure/files-and-folders-2025-12-05

# Option 3: Cherry-pick specific fixes
git checkout backup-before-restructure -- path/to/problem/file
git commit -m "fix: Restore file from backup"
```

---

## 📊 Impact Assessment

### Changes Summary

| Category | Files Moved | Impact | Risk |
|----------|-------------|---------|------|
| SQL Schemas | 4 files | High - Setup scripts | 🟡 Medium |
| Data Files | 5 files | High - Import scripts | 🟡 Medium |
| Config Files | 2 files | Low - Runtime config | 🟢 Low |
| **Total** | **11 files** | **Moderate** | **🟡 Medium** |

### Affected Components

- ✅ **Database setup scripts** - Require path updates
- ✅ **Data import scripts** - Require path updates
- ✅ **Server configuration** - May require config path updates
- ⚠️ **Third-party integrations** - Verify no hardcoded paths
- ✅ **Documentation** - Update file references

---

## 🎯 Success Criteria

The restructure is successful when:

1. ✅ All files moved to appropriate directories
2. ✅ Git history preserved for all moved files
3. ✅ Server starts without errors
4. ✅ Database setup completes successfully
5. ✅ Data import scripts work correctly
6. ✅ All tests pass
7. ✅ Documentation updated
8. ✅ No broken links or references
9. ✅ Security best practices maintained
10. ✅ Team members can work with new structure

---

## 👥 Approval Required

**Before executing this plan, please confirm:**

- [ ] Review the proposed folder structure
- [ ] Decide on large file handling strategy (Option 1, 2, or 3)
- [ ] Approve the git commands sequence
- [ ] Assign responsibility for path reference updates
- [ ] Schedule time for testing and validation
- [ ] Coordinate with team members

**To approve and proceed:**
Reply with: **"Yes, perform moves and commits now"**

Or provide specific modifications to the plan.

---

## 📝 Notes

1. **Git History:** Using `git mv` preserves file history
2. **Large Files:** Consider Git LFS or external storage for files > 500KB
3. **Sensitive Data:** The `residents_data.json` contains personal information - handle with care
4. **Backward Compatibility:** This restructure will require code updates - not fully backward compatible
5. **Team Communication:** Notify team members before merging to prevent conflicts

---

## 📅 Timeline

| Phase | Task | Estimated Time |
|-------|------|---------------|
| 1 | Plan Review & Approval | 1-2 days |
| 2 | Execute File Moves | 30 minutes |
| 3 | Update Code References | 1-2 hours |
| 4 | Testing & Validation | 2-3 hours |
| 5 | Documentation Updates | 1 hour |
| 6 | Team Review | 1-2 days |
| **Total** | | **3-5 days** |

---

## 🔗 Related Documents

- [README.md](README.md) - Main project documentation
- [docs/STRUCTURE.md](docs/STRUCTURE.md) - Current structure guide
- [docs/RESTRUCTURE_SUMMARY.md](docs/RESTRUCTURE_SUMMARY.md) - Phase 1 completion summary
- [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) - Developer migration guide
- [docs/SECURITY.md](docs/SECURITY.md) - Security guidelines

---

**Status:** 📋 Awaiting approval and confirmation to proceed

**Last Updated:** 2025-12-05  
**Author:** Repository Restructure Initiative  
**Contact:** See repository maintainers

---

_⚠️ This is a proposed plan. Do not execute these commands without explicit approval._
