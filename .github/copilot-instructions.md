# GitHub Copilot Instructions for University Traffic Management System

## Project Overview

This is a comprehensive University Traffic Management System (نظام إدارة المرور الجامعي) for managing traffic violations, parking, and residential units at the Faculty Housing Unit of Imam Muhammad bin Saud Islamic University.

### Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (cloud-ready with Supabase/Neon/Railway support)
- **Frontend**: Vanilla JavaScript with HTML/CSS (no framework)
- **Authentication**: bcryptjs for password hashing
- **Security**: Helmet.js, express-rate-limit, CORS
- **File Processing**: multer, XLSX, PDFKit
- **Environment**: dotenv for configuration

### Key Features

- Multi-role authentication system (Admin, Violations Officer, Inquiry)
- Traffic violation management with image support
- Plate recognition integration (Plate Recognizer API)
- Residential units and buildings management
- Comprehensive reporting (Excel, PDF, HTML)
- ParkPow and webhook integration
- Real-time traffic monitoring dashboard

## Architecture Guidelines

### File Organization

- **Frontend Pages**: Root directory contains HTML files
- **JavaScript Modules**: Root directory contains `.js` files (auth.js, database.js, etc.)
- **Backend Server**: `server.js` is the main Express server
- **Jobs**: `/jobs` directory for background tasks
- **Assets**: `/assets` for static resources (images, CSS)
- **Data**: `/data` for JSON data files
- **Reports**: `/reports` for generated reports

### Database Schema

The system uses PostgreSQL with the following main tables:
- `users`: User authentication and roles
- `violations`: Traffic violations records
- `vehicles`: Vehicle database
- `residential_units`: Housing units information
- `buildings`: Building information
- `residents`: Resident information
- `stickers`: Parking sticker management
- `audit_logs`: System audit trail

Primary schema file: `schema.postgres.sql`

### API Endpoints

The server exposes RESTful APIs for:
- Authentication (`/api/auth/*`)
- Violations CRUD (`/api/violations/*`)
- Vehicles management (`/api/vehicles/*`)
- Residential units (`/api/residential-units/*`)
- Buildings (`/api/buildings/*`)
- Reports and exports (`/api/reports/*`, `/api/export/*`)
- File uploads (`/api/upload/*`)

## Coding Standards

### JavaScript Style

1. **Use Arabic and English comments**: This is a bilingual project
   ```javascript
   // تحديث حالة المخالفة / Update violation status
   ```

2. **Error Handling**: Always use try-catch blocks with proper error messages
   ```javascript
   try {
       // code
   } catch (error) {
       console.error('Error message / رسالة خطأ:', error);
       res.status(500).json({ error: 'Descriptive error message' });
   }
   ```

3. **Async/Await**: Prefer async/await over promises
   ```javascript
   async function getData() {
       const result = await db.query('SELECT * FROM table');
       return result.rows;
   }
   ```

4. **Constants**: Use UPPER_CASE for constants
   ```javascript
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   ```

### Frontend Patterns

1. **No Frameworks**: Use vanilla JavaScript, no React/Vue/Angular
2. **LocalStorage**: User authentication state is stored in localStorage
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   ```

3. **DOM Manipulation**: Use standard DOM APIs
   ```javascript
   document.getElementById('elementId').addEventListener('click', handler);
   ```

4. **Bilingual UI**: Support both Arabic and English text in UI elements

### Security Best Practices

1. **Never Commit Secrets**: Use environment variables for sensitive data
   - Database credentials → `.env` file
   - API tokens → `.env` file or localStorage
   - See `.env.example` for reference

2. **Password Security**: Use bcryptjs with proper salt rounds (10+)
   ```javascript
   const hash = await bcrypt.hash(password, 10);
   ```

3. **Input Validation**: Validate and sanitize all user inputs
   ```javascript
   if (!email || !email.includes('@')) {
       return res.status(400).json({ error: 'Invalid email' });
   }
   ```

4. **Rate Limiting**: Already configured in server.js, respect the limits

5. **Sensitive Data**: The system contains real resident data (1,057+ residents)
   - Be extremely careful with data queries
   - Never log sensitive data
   - Follow GDPR-like privacy principles

### Database Queries

1. **Use Parameterized Queries**: Prevent SQL injection
   ```javascript
   await db.query('SELECT * FROM table WHERE id = $1', [userId]);
   ```

2. **Transaction Support**: Use transactions for multi-step operations
   ```javascript
   await client.query('BEGIN');
   try {
       await client.query('INSERT...');
       await client.query('UPDATE...');
       await client.query('COMMIT');
   } catch (e) {
       await client.query('ROLLBACK');
       throw e;
   }
   ```

3. **Connection Pooling**: Use the existing pg Pool instance from database.js

## Testing Guidelines

### Available Test Scripts

- `npm test` or `npm run test:api`: Run API tests
- `node test-api.js`: Direct API testing

### Testing Approach

1. **API Testing**: Test all endpoints with various scenarios
2. **Error Cases**: Test error handling and edge cases
3. **Authentication**: Test role-based access control
4. **Data Validation**: Verify input validation works

### Manual Testing

1. Start the server: `npm start`
2. Access UI at: `http://localhost:3000`
3. Test default credentials:
   - Admin: `admin` / `admin123`
   - Violations: `violations` / `violations123`
   - Inquiry: `inquiry` / `inquiry123`

## External Integrations

### Plate Recognizer API

- API Base: `https://api.platerecognizer.com/v1`
- Endpoint: `/plate-reader/`
- Rate Limit: 8 calls/second, 50,000/month
- Configuration: Via localStorage or webhook_configuration.html
- Never hardcode API tokens in source code

### ParkPow Integration

- Webhook endpoint for sending violation data
- Configured via webhook_configuration.html
- POST requests with JSON payload

## Documentation

### Key Documentation Files

- `README.md`: Main project documentation (bilingual)
- `SECURITY.md`: Security guidelines and sensitive data handling
- `INTEGRATION_GUIDE.md`: External API integration patterns
- `SYSTEM_MAP.md`: Complete system architecture map
- `API_SETUP.md`: Plate Recognizer API setup
- `CLOUD_DATABASE_GUIDE.md`: Database deployment guide
- `DEPLOYMENT_CHECKLIST.md`: Production deployment steps

### When to Update Documentation

- Adding new features → Update README.md and SYSTEM_MAP.md
- API changes → Update INTEGRATION_GUIDE.md
- Security changes → Update SECURITY.md
- New endpoints → Update API documentation

## Common Tasks

### Adding a New Page

1. Create HTML file in root directory
2. Include auth.js for authentication checks
3. Add navigation link in home.html
4. Update SYSTEM_MAP.md with new page info

### Adding a New API Endpoint

1. Add route in server.js
2. Implement handler with proper error handling
3. Add authentication/authorization checks
4. Document in code comments
5. Test with test-api.js

### Database Schema Changes

1. Update `schema.postgres.sql`
2. Create migration script if needed
3. Test with `npm run setup`
4. Update database_documentation.md

### Adding New Dependencies

1. Check for security vulnerabilities
2. Add to package.json with exact version
3. Document why it's needed
4. Update README.md if it affects setup

## Performance Considerations

1. **Pagination**: Always paginate large data sets
2. **File Size Limits**: 5MB for uploads (configurable in server.js)
3. **PDF Export Limit**: Max 100 records per PDF (see PDF_EXPORT_LIMIT)
4. **Database Indexing**: Use indexes on frequently queried columns
5. **Caching**: Consider caching for static data

## Deployment Notes

1. **Environment Variables**: Set all required vars from `.env.example`
2. **Database**: Ensure PostgreSQL is properly configured
3. **SSL**: Enable HTTPS in production
4. **Default Passwords**: MUST be changed before production deployment
5. **API Tokens**: Configure via secure methods (env vars, not localStorage)

## Bilingual Development

This project serves Arabic-speaking users but documentation should be bilingual:

- Code comments: Arabic AND English
- UI labels: Primarily Arabic with English support
- Error messages: Bilingual when possible
- Documentation: Bilingual (some files are Arabic-only, some English-only)

Example:
```javascript
// التحقق من صلاحيات المستخدم / Verify user permissions
if (user.role !== 'admin') {
    return res.status(403).json({ 
        error: 'غير مصرح / Unauthorized',
        message: 'Admin access required / مطلوب صلاحيات المدير'
    });
}
```

## Important Reminders

1. ⚠️ **Sensitive Data**: This system contains real personal data of 1,057+ residents
2. 🔒 **Security First**: Never commit secrets, always validate inputs
3. 📝 **Documentation**: Keep docs updated with changes
4. 🧪 **Test First**: Test changes before committing
5. 🌍 **Bilingual**: Support both Arabic and English
6. 🔑 **Change Defaults**: Default passwords MUST be changed in production
7. 🚀 **Cloud Ready**: System supports multiple cloud database providers

## Getting Help

- Review existing code patterns before implementing new features
- Check SYSTEM_MAP.md for architecture overview
- See INTEGRATION_GUIDE.md for API integration examples
- Consult SECURITY.md for security-related questions
