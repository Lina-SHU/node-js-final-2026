const express = require('express');
const cors = require('cors');
const { dataSource } = require('./db/data-source');
const appError = require('./utils/appError');
const skill = require('./routes/skill');
const creditPackage = require('./routes/creditPackage');
const user = require('./routes/user');
const adminRevenue = require('./routes/adminRevenue');
const adminCoach = require('./routes/adminCoaches');
const adminCourse =  require('./routes/adminCourses');
const course = require('./routes/courses'); 
const coach = require('./routes/coaches');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/healthcheck', async (req, res, next) => {
    try {
        await dataSource.query('SELECT 1');
        res.status(200).send('OK');
    } catch (err) {
        console.error('Healthcheck DB error:', err);
        res.status(503).send('Service Unavailable');
    }
});

app.use('/api/coaches/skill', skill);
app.use('/api/credit-package', creditPackage);
app.use('/api/users', user);
app.use('/api/admin/coaches/revenue', adminRevenue);
app.use('/api/admin/coaches/courses', adminCourse);
app.use('/api/admin/coaches', adminCoach);
app.use('/api/courses', course);
app.use('/api/coaches', coach);

// 404
app.use((req, res, next) => {
    next(appError(404, '無此路由'));
});

// 錯誤處理守門員
app.use((err, req, res, next) => {
    const statusCode = err.status || 500; // 500/ 401 /409
    res.status(statusCode).json({
        status: statusCode === 500 ? 'error' : 'failed',
        message: err.message || '伺服器錯誤'
    });
});

module.exports = app;
