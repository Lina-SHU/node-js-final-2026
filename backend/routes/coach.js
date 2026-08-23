const router = require('express').Router();
const coachController = require('../controllers/coach');
const isAuth = require('../middlewares/isAuth');
const isCoach = require('../middlewares/isCoach');

router.get('/', isAuth, isCoach, coachController.getCoaches);
router.put('/', isAuth, isCoach, coachController.updateCoachInfo);
router.get('/courses', isAuth, isCoach, coachController.getCoursesByCoach);
router.post('/courses', isAuth, isCoach, coachController.postCourseByCoach);
router.get('/courses/:courseId', isAuth, isCoach, coachController.getCourseInfo);
router.put('/courses/:courseId', isAuth, isCoach, coachController.updateCourseInfo);
router.post('/:userId', coachController.postCoachInfo);

module.exports = router;
