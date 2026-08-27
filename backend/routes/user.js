const router = require('express').Router();
const userController = require('../controllers/user');
const isAuth = require('../middlewares/isAuth');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/profile', isAuth, userController.getProfile);
router.put('/profile', isAuth, userController.updateUserName);
router.put('/password', isAuth, userController.updateUserPassword);
router.get('/credit-package', isAuth, userController.getCreditPackage);
router.get('/courses', isAuth, userController.getUserCourses);

module.exports = router;
