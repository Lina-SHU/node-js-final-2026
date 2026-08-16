const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/healthcheck', (req, res) => {
    res.status(200).send('OK');
});

// 404
app.use((req, res) => {
    res.status(404).json({ status: 'failed', message: '無此路由' })
});

// 錯誤處理守門員
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ status: 'failed', message: '伺服器錯誤' });
});

module.exports = app;
