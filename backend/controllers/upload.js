const fs = require('node:fs');
const { formidable } = require('formidable');
require('dotenv').config();
const config = require('../config');
const appError = require('../utils/appError');

function getUploadConfig() {
    return {
        uploadDir: config.get('upload.uploadDir'),
        maxFileSize: config.get('upload.maxFileSize') * 1024 * 1024,
        gymName: config.get('upload.gymName')
    }
};

const UploadController = {
    async uploadPhoto(req, res, next) {
        try {
            const uploadConfig = getUploadConfig();
            fs.mkdirSync(uploadConfig.uploadDir, { recursive: true });

            const form = formidable({
                uploadDir: uploadConfig.uploadDir,
                maxFileSize: uploadConfig.maxFileSize,
                keepExtensions: true
            });

            form.on('error', (err) => {
                return next(appError(500, '伺服器錯誤'));
            });

            form.parse(req, (err, fields, files) => {
                if (err) {
                    return next(appError(500, '伺服器錯誤'));
                }

                const file = files.file?.[0];
                if (!file) {
                    return next(appError(400, '沒有圖片上傳'));
                }

                // 只能上傳 JPG / PNG
                const allowMimeType = ['image/jpeg', 'image/png'];
                if (!allowMimeType.includes(file.mimetype)) {
                    return next(appError(400, '只可上傳 jpeg 或 png 圖片'));
                }

                res.json({
                    status: 'success',
                    data: {
                        image_url: file.filepath
                    }
                })
                return;
            })
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    }
};

module.exports = UploadController;