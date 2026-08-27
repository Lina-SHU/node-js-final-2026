const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { MoreThan, LessThanOrEqual, IsNull } = require('typeorm');

const CourseController = {
    async getCourses(req, res, next) {
        try {
            const courseRepo = dataSource.getRepository('Course');
            const findCourses = await courseRepo.find({
                where: {
                    start_at: LessThanOrEqual(new Date()),
                    end_at: MoreThan(new Date())
                },
                order: { start_at: 'ASC' },
                relations: {
                    user: true,
                    skill: true
                }
            });
            const courseList = findCourses.map((course) => ({
                id: course.id,
                name: course.name,
                description: course.description,
                start_at: course.start_at,
                end_at: course.end_at,
                max_participants: course.max_participants,
                coach_name: course.user.name,
                skill_name: course.skill.name
            }));
            res.json({
                status: 'success',
                data: courseList
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async createBooking(req, res, next) {
        try {
            const { courseId } = req.params;
            const userInfo = req.user;
            // courseId 查無此課程 → 「ID錯誤」
            const courseRepo = dataSource.getRepository('Course');
            const findCourse = await courseRepo.findOneBy({ id: courseId });
            if (!findCourse) {
                return next(appError(400, 'ID錯誤'));
            }
            // 已有此課程的報名紀錄（含已取消） → 「已經報名過此課程」
            const courseBookingRepo = dataSource.getRepository('CourseBooking');
            const findCourseBooking = await courseBookingRepo.findOneBy({ course_id: courseId, user_id: userInfo.id });
            if (findCourseBooking) {
                return next(appError(400, '已經報名過此課程'));
            }
            // 剩餘堂數歸零（購買堂數加總 − 未取消報名數 ≤ 0，沒買過方案也算） → 「已無可使用堂數」
            const purchaseRepo = dataSource.getRepository('CreditPurchase');
            const purchase = await purchaseRepo.find({
                where: { user_id: userInfo.id }
            });
            const totalCredits = purchase.reduce((sum, p) => sum + p.purchased_credits, 0);
            const usageCount = await courseBookingRepo.count({
                where: { user_id: userInfo.id, cancelled_at: IsNull() }
            });
            if (totalCredits - usageCount <= 0) {
                return next(appError(400, '已無可使用堂數'));
            }
            // 課程有效報名人數已達上限 → 「已達最大參加人數，無法參加」
            const bookingCount = await courseBookingRepo.count({
                where: { course_id: courseId, cancelled_at: IsNull() }
            });
            if (bookingCount >= findCourse.max_participants) {
                return next(appError(400, '已達最大參加人數，無法參加'));
            }

            await courseBookingRepo.save({
                user_id: userInfo.id,
                course_id: courseId
            });
            res.status(201).json({
                status: 'success',
                data: null
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async cancelBooking(req, res, next) {
        try {
            const { courseId } = req.params;
            const userInfo = req.user;
            const courseBookingRepo = dataSource.getRepository('CourseBooking');
            // 找不到「這位使用者對這門課、尚未取消」的報名紀錄 （課程不存在／從未報名／已經取消過，三種情況都回這句）
            const findBooking = await courseBookingRepo.findOneBy({
                course_id: courseId,
                user_id: userInfo.id,
                cancelled_at: IsNull()
            });
            if (!findBooking) {
                return next(appError(400, 'ID錯誤'));
            }

            findBooking.cancelled_at = new Date();
            await courseBookingRepo.save(findBooking);
            res.json({
                status: 'success',
                data: null
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    }
};

module.exports = CourseController;
