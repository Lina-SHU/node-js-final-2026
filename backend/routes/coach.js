const router = require('express').Router();
const adminCoachController = require('../controllers/adminCoaches');
const isAuth = require('../middlewares/isAuth');
const isCoach = require('../middlewares/isCoach');

router.get('/', isAuth, isCoach, adminCoachController.getCoaches);
router.put('/', isAuth, isCoach, adminCoachController.updateCoachInfo);
router.get('/courses', isAuth, isCoach, adminCoachController.getCoursesByCoach);
router.post('/courses', isAuth, isCoach, adminCoachController.postCourseByCoach);
router.get('/courses/:courseId', isAuth, isCoach, adminCoachController.getCourseInfo);
router.put('/courses/:courseId', isAuth, isCoach, adminCoachController.updateCourseInfo);
router.post('/:userId', adminCoachController.postCoachInfo);

module.exports = router;
