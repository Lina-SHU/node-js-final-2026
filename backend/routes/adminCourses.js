const router = require('express').Router();
const adminCourseController = require('../controllers/adminCourses');
const isAuth = require('../middlewares/isAuth');
const isCoach = require('../middlewares/isCoach');

router.get('/', isAuth, isCoach, adminCourseController.getCoursesByCoach);
router.post('/', isAuth, isCoach, adminCourseController.postCourseByCoach);
router.get('/:courseId', isAuth, isCoach, adminCourseController.getCourseInfo);
router.put('/:courseId', isAuth, isCoach, adminCourseController.updateCourseInfo);

module.exports = router;
