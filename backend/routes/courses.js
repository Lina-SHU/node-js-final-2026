const router = require('express').Router();
const courseController = require('../controllers/courses');
const isAuth = require('../middlewares/isAuth');

router.get('/', courseController.getCourses);
router.post('/:courseId', isAuth, courseController.createBooking);
router.delete('/:courseId', isAuth, courseController.cancelBooking);

module.exports = router;
