const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/vaildUtils");
const bcript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const PWD_ERR = '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字';

const userController = {
    async signup(req, res, next) {
        const { name, email, password } = req.body;
        if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
            return next(appError(400, '欄位未填寫正確'));
        }
        if (!isValidPassword(password)) {
            return next(appError(400, PWD_ERR));
        }

        const userRepo = dataSource.getRepository('User');
        const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });
        if (findUser) {
            return next(appError(409, 'Email 已被使用'));
        }
        const hash = await bcript.hash(password, 10);
        const newUser = await userRepo.save({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hash,
            role: 'USER'
        });

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: newUser.id,
                    name: newUser.name
                }
            }
        });
        return;
    },
    async login(req, res, next) {
        const { email, password } = req.body;
        if (!isValidString(email) || !isValidString(password)) {
            return next(appError(400, '欄位未填寫正確'));
        }
        if (!isValidPassword(password)) {
            return next(appError(400, PWD_ERR));
        }

        const userRepo = dataSource.getRepository('User');
        const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });
        if (!findUser) {
            return next(appError(400, '使用者不存在或密碼輸入錯誤'));
        }

        const comparePwd = await bcript.compare(password, findUser.password);
        if (!comparePwd) {
            return next(appError(400, '使用者不存在或密碼輸入錯誤'));
        }
        const token = await jwt.sign(
            {
                id: findUser.id,
                role: findUser.role
            },
            config.get('secret.jwtSecret'),
            {
                expiresIn: config.get('secret.jwtExpiresDay')
            }
        );
        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: {
                    name: findUser.name
                }
            }
        });
        return;
    },
    async getProfile(req, res, next) {
        // isAuth 已經把 user 掛到 req.user
        res.json({
            status: 'success',
            data: {
                user: {
                    name: req.user.name,
                    email: req.user.email
                }
            }
        });
        return;
    },
    async updateUserName(req, res, next) {
        const { name } = req.body;
        const userInfo = req.user;

        // name 缺漏或為空字串：「欄位未填寫正確」
        if (!isValidString(name)) {
            return next(appError(400, '欄位未填寫正確'));
        }
        // ⚠️ 新名稱與目前名稱相同：「使用者名稱未變更」
        if (userInfo.name === name) {
            return next(appError(400, '使用者名稱未變更'));
        }
        // 更新沒有生效（極少見的邊角情況）：「更新使用者資料失敗」
        const userRepo = dataSource.getRepository('User');
        const result = await userRepo.update({ id: userInfo.id }, { name: name.trim() });

        if (result.affected === 0) {
            return next(appError(400, '更新使用者資料失敗'));
        }

        res.json({
            status: 'success',
            data: {
                user: {
                    name: name.trim()
                }
            }
        });
        return;
    },
    async updateUserPassword(req, res, next) {
        const { password, new_password, confirm_new_password } = req.body;
        const userInfo = req.user;
        // 三個欄位任一缺漏或為空字串 → 400「欄位未填寫正確」
        if (!isValidString(password) || !isValidString(new_password) || !isValidString(confirm_new_password)) {
            return next(appError(400, '欄位未填寫正確'));
        }
        // ⚠️ 三個欄位「全部」都要通過密碼規則（含英文大小寫與數字、8～16 字）—— 不是只檢查新密碼，舊密碼格式不符也會擋 → 400「密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字」
        if (!isValidPassword(password) || !isValidPassword(new_password) || !isValidPassword(confirm_new_password)) {
            return next(appError(400, PWD_ERR));
        }
        // ⚠️ 新密碼跟舊密碼相同會被擋 → 400「新密碼不能與舊密碼相同」
        if (password === new_password) {
            return next(appError(400, '新密碼不能與舊密碼相同'));
        }
        // new_password 與 confirm_new_password 不一致 → 400「新密碼與驗證新密碼不一致」
        if (new_password !== confirm_new_password) {
            return next(appError(400, '新密碼與驗證新密碼不一致'));
        }
        // 舊密碼比對錯誤 → 400「密碼輸入錯誤」
        const comparePwd = await bcript.compare(password, userInfo.password);
        if (!comparePwd) {
            return next(appError(400, '密碼輸入錯誤'));
        }

        const hash = await bcript.hash(new_password, 10);
        const userRepo = dataSource.getRepository('User');
        const result = await userRepo.update({ id: userInfo.id }, { password: hash });
        if (result.affected === 0) {
            return next(appError(400, '更新使用者資料失敗'));
        }
        res.json({
            status: 'success',
            data: null
        });
        return;
    },
};

module.exports = userController;