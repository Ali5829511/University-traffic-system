/**
 * Database Configuration
 * إعدادات قاعدة البيانات
 * 
 * يدعم الاتصال بقواعد البيانات السحابية مثل:
 * - Supabase (PostgreSQL)
 * - Neon (PostgreSQL)
 * - AWS RDS (PostgreSQL/MySQL)
 * - Google Cloud SQL
 * - Azure Database
 */

const { Pool } = require('pg');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.connected = false;
        this.initializePool();
    }

    initializePool() {
        // Check if DATABASE_URL is provided (for cloud databases)
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            console.warn('⚠️  DATABASE_URL not found in environment variables');
            console.warn('⚠️  Please create a .env file with your database connection string');
            console.warn('⚠️  Example: DATABASE_URL=postgresql://user:password@host:port/database');
            return;
        }

        // Create connection pool
        this.pool = new Pool({
            connectionString: connectionString,
            ssl: process.env.DB_SSL === 'true' ? {
                rejectUnauthorized: false
            } : false,
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            this.connected = false;
        });

        this.pool.on('connect', () => {
            this.connected = true;
        });
    }

    /**
     * Test database connection
     */
    async testConnection() {
        if (!this.pool) {
            throw new Error('Database pool not initialized. Please check DATABASE_URL in .env file');
        }

        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            this.connected = true;
            console.log('✓ Database connection successful:', result.rows[0].now);
            return true;
        } catch (error) {
            this.connected = false;
            console.error('✗ Database connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Execute a query
     */
    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not configured. Please set DATABASE_URL in .env file');
        }

        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('Executed query', { text, duration, rows: result.rowCount });
            }
            
            return result;
        } catch (error) {
            console.error('Query error:', error.message);
            throw error;
        }
    }

    /**
     * Get a client from the pool for transactions
     */
    async getClient() {
        if (!this.pool) {
            throw new Error('Database not configured');
        }
        return await this.pool.connect();
    }

    /**
     * Check if database is connected
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Close all connections
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.connected = false;
            console.log('✓ Database connections closed');
        }
    }

    /**
     * Initialize database schema (for first-time setup)
     */
    async initializeSchema() {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const schemaPath = path.join(__dirname, '../../../database/schemas/schema.postgres.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            await this.query(schema);
            console.log('✓ Database schema initialized successfully');
            return true;
        } catch (error) {
            console.error('✗ Schema initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Seed default users with bcrypt hashed passwords
     */
    async seedDefaultUsers() {
        const bcrypt = require('bcryptjs');
        
        try {
            // Hash passwords
            const adminPassword = await bcrypt.hash('admin123', 10);
            const officerPassword = await bcrypt.hash('officer123', 10);
            const inquiryPassword = await bcrypt.hash('inquiry123', 10);

            const users = [
                {
                    username: 'admin',
                    password_hash: adminPassword,
                    full_name: 'مدير النظام',
                    email: 'admin@university.edu.sa',
                    role: 'admin'
                },
                {
                    username: 'violations_officer',
                    password_hash: officerPassword,
                    full_name: 'مسجل المخالفات',
                    email: 'violations@university.edu.sa',
                    role: 'violations_officer'
                },
                {
                    username: 'inquiry_user',
                    password_hash: inquiryPassword,
                    full_name: 'موظف الاستعلام',
                    email: 'inquiry@university.edu.sa',
                    role: 'inquiry_user'
                }
            ];

            for (const user of users) {
                await this.query(
                    `INSERT INTO users (username, password_hash, full_name, email, role, is_active)
                     VALUES ($1, $2, $3, $4, $5, true)
                     ON CONFLICT (username) DO UPDATE
                     SET password_hash = EXCLUDED.password_hash`,
                    [user.username, user.password_hash, user.full_name, user.email, user.role]
                );
            }

            console.log('✓ Default users seeded successfully');
            return true;
        } catch (error) {
            console.error('✗ User seeding failed:', error.message);
            throw error;
        }
    }
}

// Create and export a singleton instance
const db = new DatabaseConnection();

module.exports = db;
