const fs = require('node:fs');
const path = require('node:path');
const pool = require('./db_conexion');

async function initDb() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

    try {
        for (const statement of statements) {
            await pool.query(statement);
        }
        console.log('Schema aplicat correctament.');
    } finally {
        await pool.end();
    }
}

initDb().catch(err => {
    console.error('Error aplicant el schema:', err);
    process.exit(1);
});
