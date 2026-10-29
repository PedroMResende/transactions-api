const { Pool } = require('pg');

const config = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL
    }
    : {
        host: process.env.DB_HOST || 'postgres',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'transactions',

        ...(process.env.DB_SSL === 'true'
            ? { ssl: { rejectUnauthorized: false } }
            : {})
    };

const pool = new Pool(config);

module.exports = pool;