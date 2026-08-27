const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/vaildUtils");

const adminCourseController = {
    async getCoursesByCoach(req, res, next) {
        try {
            const userInfo = req.user;
            const courseRepo = dataSource.getRepository('Course');
            const findCourseByCoach = await courseRepo.find({ where: { user_id: userInfo.id } });

            // participants 是該課程「未取消」的報名數——已取消的報名不計。
            const courseBooking = dataSource.getRepository('CourseBooking');
            const courseIds = findCourseByCoach.map((course) => course.id);
            const counts = await courseBooking.createQueryBuilder('booking')
                .select('booking.course_id', 'course_id')
                .addSelect('COUNT(*)', 'total')
                .where('booking.cancelled_at IS NULL')
                .andWhere('booking.course_id IN (:...courseIds)', { courseIds })
                .groupBy('booking.course_id')
                .getRawMany();
            const countsMap = new Map(
                counts.map((item) =>[
                    item.course_id,
                    Number(item.total)
                ])
            );
            // status 是三態中文字串（尚未開始／進行中／已結束）
            findCourseByCoach.forEach((course) => {
                const now = new Date();
                if (now < course.start_at) {
                    course.status = '尚未開始';
                } else if (now >= course.start_at && now <= course.end_at) {
                    course.status = '進行中';
                } else {
                    course.status = '已結束';
                }
                course.participants = countsMap.get(course.id) ?? 0;
                // 移除不需要回傳的 key
                delete course.created_at;
                delete course.updated_at;
                delete course.user_id;
                delete course.skill_id;
                delete course.description;
            });

            res.json({
                status: 'success',
                data: findCourseByCoach
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async postCourseByCoach(req, res, next) {
        try {
            const {
                skill_id,
                name,
                description,
                start_at,
                end_at,
                max_participants,
                meeting_url
            } = req.body;

            const userInfo = req.user;
            // 任一欄位缺漏或為空字串、max_participants 不是數字型別的 0 以上整數、meeting_url 不是 https 開頭。
            if (
                !isValidString(skill_id) ||
                !isValidString(name) ||
                !isValidString(description) ||
                !isValidString(start_at) ||
                !isValidString(end_at) || 
                !isInteger(max_participants) ||
                max_participants < 0 ||
                !isValidString(meeting_url) ||
                !meeting_url.trim().startsWith('https')
            ) {
                return next(appError(400, '欄位未填寫正確'));
            }

            // 確認 skill id 存在
            const skillRepo = dataSource.getRepository('Skill');
            const findSkill = await skillRepo.findOneBy({ id: skill_id });
            if (!findSkill) {
                return next(appError(400, '無此專長'));
            }
    
            const courseRepo = dataSource.getRepository('Course');
            const newCourse = await courseRepo.save({
                skill_id: skill_id.trim(),
                name: name.trim(),
                description: description.trim(),
                start_at: start_at.trim(),
                end_at: end_at.trim(),
                max_participants,
                meeting_url: meeting_url.trim(),
                user_id: userInfo.id
            });
            res.status(201).json({
                status: 'success',
                data: {
                    course: newCourse
                }
            });
            return;
        }  catch (error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async getCourseInfo(req, res, next) {
        try {
            const { courseId } = req.params;
            const userInfo = req.user;

            // 	課程 id 不存在、或這堂課不是登入者本人開的
            const courseRepo = dataSource.getRepository('Course');
            const findCourse = await courseRepo.findOneBy({ id: courseId });
            const belongToUser = await courseRepo.findOneBy({ user_id: userInfo.id });

            if (!findCourse || !belongToUser) {
                return next(appError(400, '課程不存在'));
            }

            const skillRepo = dataSource.getRepository('Skill');
            const findSkill = await skillRepo.findOneBy({ id: findCourse.skill_id });
            res.json({
                status: 'success',
                data: { ...findCourse, skill_name: findSkill.name }
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async updateCourseInfo(req, res, next) {
        try {
            const { courseId } = req.params;
            const {
                skill_id,
                name,
                description,
                start_at,
                end_at,
                max_participants,
                meeting_url
            } = req.body;
            const userInfo = req.user;

            // ①任一欄位缺漏／空字串／max_participants 非數字整數／meeting_url 不是 https 開頭 →「欄位未填寫正確」；
            if (
                !isValidString(skill_id) ||
                !isValidString(name) ||
                !isValidString(description) ||
                !isValidString(start_at) ||
                !isValidString(end_at) || 
                !isInteger(max_participants) ||
                max_participants < 0 ||
                !isValidString(meeting_url) ||
                !meeting_url.trim().startsWith('https')
            ) {
                return next(appError(400, '欄位未填寫正確'));
            }
            // ②課程 id 不存在或不是登入者本人開的 →「課程不存在」。
            const courseRepo = dataSource.getRepository('Course');
            const findCourse = await courseRepo.findOneBy({ id: courseId });
            const belongToUser = await courseRepo.findOneBy({ user_id: userInfo.id });

            if (!findCourse || !belongToUser) {
                return next(appError(400, '課程不存在'));
            }

            // 確認 skill id 存在
            const skillRepo = dataSource.getRepository('Skill');
            const findSkill = await skillRepo.findOneBy({ id: skill_id });
            if (!findSkill) {
                return next(appError(400, '無此專長'));
            }

            const result = await courseRepo.update({ id: courseId }, {
                skill_id,
                name: name.trim(),
                description: description.trim(),
                start_at,
                end_at,
                max_participants,
                meeting_url: meeting_url.trim()
            });
            if (result.affected === 0) {
                return next(appError(400, '更新使用者資料失敗'));
            }

            const findUpdatedCourse = await courseRepo.findOneBy({ id: courseId });
            res.json({
                status: 'success',
                data: {
                    course: findUpdatedCourse
                }
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    }
};

module.exports = adminCourseController;
