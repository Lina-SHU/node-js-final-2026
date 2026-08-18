const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isInteger, isValidString } = require("../utils/vaildUtils");

const creditPackageController = {
    async getCreditPackage(req, res, next) {
        const creditPackage =  await dataSource.getRepository('CreditPackage').find({
            select: { id: true, name: true, credit_amount: true, price: true }
        });
        res.json({
            status: 'success',
            data: creditPackage
        });
        return;
    },
    async postCreditPackage(req, res, next) {
        const { name, credit_amount, price } = req.body;

        if (!isValidString(name) || !isInteger(credit_amount) || !isInteger(price)) {
            next(appError(400, '欄位未填寫正確'));
            return;
        }

        const creditPackageRepo = dataSource.getRepository('CreditPackage');
        const findCreditPackage = await creditPackageRepo.findOneBy({ name: name.trim() });
        if (findCreditPackage) {
            next(appError(409, '資料重複'));
            return;
        }

        const newCreditPackage = await creditPackageRepo.save({
            name: name.trim(),
            credit_amount,
            price
        });

        res.json({
            status: 'success',
            data: newCreditPackage
        });
        return;
    },
    async deleteCreditPackage(req, res, next) {
        const { creditPackageId } = req.params;

        const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId);

        if (result.affected === 0) {
            next(appError(400, 'ID錯誤'));
            return;
        }

        res.json({
            status: 'success'
        });
        return;
    }
}

module.exports = creditPackageController;