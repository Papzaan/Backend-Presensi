const {createConnection} = require('mysql2');
require('dotenv').config();

module.exports.db = createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_NAME,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 10
});