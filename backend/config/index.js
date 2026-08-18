require('dotenv').config();

const db = require('./db');
const sercet = require('./secret');
const web = require('./web');

const config = { db, sercet, web };

function get(path) {
    const keys = path.split('.');

    let result = config;
    for (const key of keys) {
        result = result[key];
        if (result === undefined) throw new Error(`Config path not found: ${path}`)
    }
    return result
};

module.exports = { get };