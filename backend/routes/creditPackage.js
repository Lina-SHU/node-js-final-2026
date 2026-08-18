const router = require('express').Router();
const creditPackageController = require('../controllers/creditPackage');

router.get('/', creditPackageController.getCreditPackage);
router.post('/', creditPackageController.postCreditPackage);
router.delete('/:creditPackageId', creditPackageController.deleteCreditPackage);

module.exports = router;

