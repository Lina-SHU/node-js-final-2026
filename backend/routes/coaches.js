const router = require('express').Router();
const coachController = require('../controllers/coaches');

router.get('/', coachController.getCoaches);
router.get('/:coachId', coachController.getCoachInfo);
router.get('/:coachId/courses', coachController.getCourseInfoByCoach);

module.exports = router;
