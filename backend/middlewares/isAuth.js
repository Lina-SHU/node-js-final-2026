const jwt = require('jsonwebtoken');
const config = require('../config');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');

async function isAuth (req, res, next) {
    try {
        const auth = req.headers.authorization;
        // 沒帶 Authorization header、或格式不是 Bearer ：「請先登入」
        if (!auth || !auth.startsWith('Bearer ')) {
            return next(appError(401, '請先登入'));
        }
        const token = auth.split(' ')[1];

        // token 已過期：「Token 已過期」
        const decode = await jwt.verify(token, config.get('secret.jwtSecret'));
        // token 無效: 無效的 token
        // DAO 層 service
        const userRepo = dataSource.getRepository('User');
        const findUser = await userRepo.findOneBy({ id: decode.id });
        if (!findUser) {
            return next(appError(401, '無效的 token'));
        }
        req.user = findUser;
        next();
    } catch(error) {
        if (error.name === 'TokenExpiredError') {
            return next(appError(401, 'Token 已過期'));
        }
        return next(appError(401, "無效的 token"));
    }
};

module.exports = isAuth;
