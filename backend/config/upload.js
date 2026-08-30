module.exports = {
    uploadDir: process.env.UPLOAD_DIR || '/tmp',
    maxFileSize: Number(process.env.MAX_FILE_SIZE_MB) || 2 ,
    gymName: process.env.GYM_NAME
};
