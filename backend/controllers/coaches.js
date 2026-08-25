const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isInteger, isValidString } = require("../utils/vaildUtils");
const validator = require('validator');
const { MoreThan } = require('typeorm');

const CoachController = {
    async getCoaches(req, res, next) {
        try {
            const { per, page } = req.query;

            // 缺 per 或 page、或其中任何一個不是可轉成非負整數的字串
            if (
                !isInteger(Number(per)) ||
                !isInteger(Number(page)) ||
                per < 0 ||
                page < 0
            ) {
                return next(appError(400, '欄位未填寫正確'));
            }

            const coachRepo = dataSource.getRepository('Coach');
            const offset = (page - 1) * per;
            const coaches = await coachRepo.find({
                relations: { user: true },
                order: { created_at: 'ASC' },
                skip: offset,
                take: per
            });

            const coachList = coaches.map((item) => ({
                id: item.id,
                user_id: item.user.id,
                name: item.user.name
            }))
            res.json({
                status: 'success',
                data: coachList
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async getCoachInfo(req, res, next) {
        try {
            const { coachId } = req.params;
            // (2) coachId 為空或無效字串（例如字面的 undefined）
            if (!isValidString(coachId)) {
                return next(appError(400, '欄位未填寫正確'));
            }
            // (1) coachId 是合法 uuid 但查無此教練 → 「找不到該教練」；
            const coachRepo = dataSource.getRepository('Coach');
            const findCoach = await coachRepo.findOne({
                where: { id: coachId },
                relations: { user: true }
            });

            if (
                !validator.isUUID(coachId) ||
                !findCoach
            ) {
                return next(appError(400, '找不到該教練'));
            }

            const coachLinkSkillRepo = dataSource.getRepository('CoachLinkSkill');
            const coachSkillList = await coachLinkSkillRepo.find({ relations: { skill: true }, where: { coach_id: coachId } });

            const skills = coachSkillList.map((item) => {
                return item.skill.name;
            });
            const { user, ...coach } = findCoach;
            res.json({
                status: 'success',
                data: {
                    user: {
                        name: user.name,
                        role: user.role
                    },
                    coach: {
                        ...coach,
                        skills
                    }
                }
            });
            return;
        } catch(error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async getCourseInfoByCoach(req, res, next) {
        try {
            const { coachId } = req.params;

            // coachId 為空或無效字串（例如字面的 undefined）
            if (!isValidString(coachId)) {
                return next(appError(400, '欄位未填寫正確'));
            }
            // coachId 是合法 uuid 但查無此教練 → 「找不到該教練」；
            const coachRepo = dataSource.getRepository('Coach');
            const findCoach = await coachRepo.findOneBy({ id: coachId });

            if (
                !validator.isUUID(coachId) ||
                !findCoach
            ) {
                return next(appError(400, '找不到該教練'));
            }

            const courseRepo = dataSource.getRepository('Course');
            const findCourses = await courseRepo.find({
                relations: { skill: true, user: true },
                where: { user_id: findCoach.user_id, end_at: MoreThan(new Date()) },
                order: { start_at: 'ASC' }
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

module.exports = CoachController;
