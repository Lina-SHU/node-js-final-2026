const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

const AdminRevenueController = {
    async getCoachRevenue(req, res, next) {
        try {
            const { month } = req.query;
            const userInfo = req.user;

            // month 沒帶、或不是合法的英文小寫月份名
            const VAILD_MONTH = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            if (!month || !VAILD_MONTH.includes(month)) {
                return next(appError(400, '欄位未填寫正確'));
            };
            const monthNumber = VAILD_MONTH.indexOf(month) + 1;
            const year = new Date().getFullYear();
            let revenue = 0;
            let participants = 0;
            let course_count = 0;
            
            const courseBookingRepo = dataSource.getRepository('CourseBooking');

            // 該教練在該月未取消報名課程的報名資料
            const bookings = await courseBookingRepo.query(
                `select cb.user_id 
                from "course_bookings" cb
                join "courses" c on c.id = cb.course_id
                where c.user_id = $1
                and cb.cancelled_at is null
                and extract(year from cb.created_at) = $2
                and extract(month from cb.created_at) = $3;`,
                [userInfo.id, year, monthNumber]
            );
            course_count = bookings.length;
            // 課均價
            const creditPackageRepo = dataSource.getRepository('CreditPackage');
            const perCoursePrice = await creditPackageRepo.query(`select SUM(price) / SUM(credit_amount) AS per_price from "credit_packages"`);

            revenue = bookings.length ? Math.floor(Number(bookings.length * perCoursePrice[0].per_price)) : 0;

            const bookingUser = new Set(
                 bookings.map((booking) => booking.user_id)
            );
            participants = bookingUser.size;
            res.json({
                status: 'success',
                data: {
                    total: {
                        revenue,
                        participants,
                        course_count
                    }
                }
            });
            return;
        } catch (error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    }
};

module.exports = AdminRevenueController;
