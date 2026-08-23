const router = require('express').Router();
const adminCoachController = require('../controllers/adminCoaches');
const isAuth = require('../middlewares/isAuth');
const isCoach = require('../middlewares/isCoach');

router.post('/:userId', adminCoachController.postCoachInfo);
router.get('/', isAuth, isCoach, adminCoachController.getCoaches);
router.put('/', isAuth, isCoach, adminCoachController.updateCoachInfo);

module.exports = router;
