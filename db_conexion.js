const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    socketPath: '/run/mysqld/mysqld.sock',
    user: 'a25kilguapio_admin',
    password: 'Caballos09*',
    database: 'a25kilguapio_project1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
