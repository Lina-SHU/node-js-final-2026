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
 
        if (credit_amount < 0 || price < 0) {
            return next(appError(400, '欄位未填寫正確'));
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
    },
    async buyCreditPackage(req, res, next) {
        try {
            const { creditPackageId } = req.params;
            const userInfo = req.user;

            const creditPackageRepo = dataSource.getRepository('CreditPackage');

            const findCreditPackage = await creditPackageRepo.findOneBy({ id: creditPackageId });

            if (!findCreditPackage) {
                return next(appError(400, 'ID錯誤'));
            }

            const creditPurchasesRepo = dataSource.getRepository('CreditPurchase');
            await creditPurchasesRepo.save({
                user_id: userInfo.id,
                credit_package_id: creditPackageId,
                purchased_credits: findCreditPackage.credit_amount,
                price_paid: findCreditPackage.price
            });
            res.json({
                status: 'success',
                data: null
            })
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    }
}

module.exports = creditPackageController;