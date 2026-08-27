const router = require('express').Router();
const creditPackageController = require('../controllers/creditPackage');
const isAuth = require('../middlewares/isAuth');

router.get('/', creditPackageController.getCreditPackage);
router.post('/', creditPackageController.postCreditPackage);
router.delete('/:creditPackageId', creditPackageController.deleteCreditPackage);
router.post('/:creditPackageId', isAuth, creditPackageController.buyCreditPackage);

module.exports = router;

