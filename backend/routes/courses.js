const router = require('express').Router();
const courseController = require('../controllers/courses');

router.get('/', courseController.getCourses);

module.exports = router;
