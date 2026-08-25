const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { MoreThan, LessThanOrEqual } = require('typeorm');

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
    }
};

module.exports = CourseController;
