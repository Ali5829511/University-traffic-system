# Copilot Instructions for University Traffic Management System

## Project Overview

This is a University Traffic Management System (نظام إدارة المرور الجامعي) for managing traffic violations, vehicle registration, and residential units at Imam Muhammad ibn Saud Islamic University.

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (cloud-ready) with localStorage fallback for development
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Helmet.js, bcrypt for password hashing, rate limiting
- **File Handling**: Multer for uploads, XLSX for Excel, PDFKit for PDF generation

## Project Structure

```
/
├── server.js              # Main Express server
├── auth.js                # Authentication & authorization (frontend)
├── database.js            # Local database manager (frontend)
├── db-config.js           # PostgreSQL database configuration
├── package.json           # Node.js dependencies
├── .github/               # GitHub workflows and configurations
├── js/                    # Frontend JavaScript modules
├── jobs/                  # Background job scripts
├── data/                  # Data files (JSON)
├── reports/               # Generated reports
└── *.html                 # Frontend pages
```

## Coding Conventions

### JavaScript Style

- Use ES6+ features (const/let, arrow functions, template literals, async/await)
- Use JSDoc comments for function documentation
- Include bilingual comments (Arabic and English) for major sections
- Use camelCase for variables and functions
- Use PascalCase for class names
- Use SCREAMING_SNAKE_CASE for constants

### Example Code Pattern

```javascript
/**
 * وصف الوظيفة بالعربية
 * Function description in English
 * @param {string} param - Parameter description
 * @returns {Object} Return value description
 */
async function exampleFunction(param) {
    // تعليق بالعربية / English comment
    const result = await someAsyncOperation(param);
    return result;
}
```

### Error Handling

- Always use try-catch blocks for async operations
- Return standardized JSON responses from API endpoints:
  ```javascript
  { success: true, data: {...} }
  { success: false, message: 'Error description' }
  ```

### Security Best Practices

- Never hardcode API keys or credentials (use environment variables)
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Apply rate limiting to API endpoints
- Use Helmet.js security middleware

## Role-Based Access Control

The system has these user roles:
- `admin` - Full system access
- `violations_officer` - Can add/edit violations
- `inquiry_user` - Read-only access
- `manager` - Similar to admin without user management
- `violation_entry` - Can only add violations

## API Endpoints Pattern

REST API endpoints follow this pattern:
- `GET /api/v1/{resource}` - List resources
- `GET /api/v1/{resource}/:id` - Get single resource
- `POST /api/v1/{resource}` - Create resource
- `PUT /api/v1/{resource}/:id` - Update resource
- `DELETE /api/v1/{resource}/:id` - Delete resource

## Testing

Run tests with:
```bash
npm test  # Run API tests
```

## Development Setup

```bash
npm install          # Install dependencies
cp .env.example .env # Configure environment
npm run setup        # Initialize database
npm start            # Start server on port 3000
```

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)

## Internationalization

- The system supports Arabic (primary) and English
- Use RTL-compatible CSS for Arabic text
- Include bilingual labels where appropriate

## Important Files to Review

- `SECURITY.md` - Security guidelines
- `CLOUD_DATABASE_GUIDE.md` - Database setup
- `API_SETUP.md` - API configuration
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps
