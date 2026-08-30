require('dotenv').config();

const db = require('./db');
const secret = require('./secret');
const web = require('./web');
const upload = require('./upload');

const config = { db, secret, web, upload };

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