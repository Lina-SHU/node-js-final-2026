const router = require('express').Router();
const uploadPhotoController = require('../controllers/upload');
const isAuth = require('../middlewares/isAuth');

router.post('/', isAuth, uploadPhotoController.uploadPhoto);

module.exports = router;
