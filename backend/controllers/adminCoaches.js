const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/vaildUtils");
const validator = require('validator');

const adminCoachController = {
    async postCoachInfo(req, res, next) {
        try {
            const { experience_years, description, profile_image_url } = req.body;
            const { userId } = req.params;
    
            // 必填
            if (!isValidString(description) || !isInteger(experience_years)) {
                return next(appError(400, '欄位未填寫正確'));
            }
            // 經驗大於 0
            if (experience_years < 0 ) {
                return next(appError(400, '欄位未填寫正確'));
            }
    
            // 有填但要 https 開頭
            if (isValidString(profile_image_url) && !profile_image_url.trim().startsWith('https')) {
                return next(appError(400, '欄位未填寫正確'));
            }
    
            // 查無使用者
            const userRepo = dataSource.getRepository('User');
            const findUser = await userRepo.findOneBy({ id: userId });
            if (!findUser) {
                return next(appError(400, '使用者不存在'));
            }
    
            // 該使用者已經是教練（重複升級）
            if (findUser.role === 'COACH') {
                return next(appError(409, '使用者已經是教練'));
            }
    
            const result = await dataSource.transaction(async(manager) => {
                // 升級
                const result = await manager.update(
                    'User',
                    { id: userId }, { role: 'COACH' }
                );

                // 寫入教練表
                const newCoach = await manager.save('Coach', {
                    user_id: userId,
                    experience_years,
                    description: description.trim(),
                    profile_image_url: profile_image_url ? profile_image_url.trim() : null
                });

                // 重新取得更新後使用者資訊
                const newUser = await manager.findOneBy('User', {
                    id: userId
                });
    
                return { newUser, newCoach };
            });
            res.json({
                status: 'success',
                data: {
                    user: {
                        name: result.newUser.name,
                        role: result.newUser.role
                    },
                    coach: {
                        ...result.newCoach
                    }
                }
            });
            return;
        }  catch (error) {
            console.error('response 失敗:', error);
            return next(appError(500, '伺服器錯誤'));
        }
    },
    async getCoaches(req, res, next) {
        const userInfo = req.user;
        const coachRepo = dataSource.getRepository('Coach');
        const result = await coachRepo.findOneBy({ user_id: userInfo.id });

        const coachLinkSkillRepo = dataSource.getRepository('CoachLinkSkill');
        const resultLink = await coachLinkSkillRepo.find({ where: { coach_id: result.id }});
        const skillIds = resultLink ? resultLink.map((skill) => skill.skill_id) : []
        res.json({
            status: 'success',
            data: {
                id: result.id,
                experience_years: result.experience_years,
                description: result.description,
                profile_image_url: result.profile_image_url,
                skill_ids: skillIds
            }
        });
        return;
    },
    async updateCoachInfo(req, res, next) {
        const {
            experience_years,
            description,
            profile_image_url,
            skill_ids
        } = req.body;
        const userInfo = req.user;

        // experience_years 不是 0 以上的整數
        if (!isInteger(experience_years) || experience_years < 0) {
            return next(appError(400, '欄位未填寫正確'));
        }
        // description 沒給或是空字串
        if (!isValidString(description)) {
            return next(appError(400, '欄位未填寫正確'));
        }
        // profile_image_url 沒給、是空字串、或不是 https 開頭（⚠️ 這支是必填）
        if (!isValidString(profile_image_url) || !profile_image_url.trim().startsWith('https')) {
            return next(appError(400, '欄位未填寫正確'));
        }
        // skill_ids 沒給、不是陣列、是空陣列、或元素不是有效的 id 字串
        if (
            !Array.isArray(skill_ids) ||
            skill_ids.length === 0 ||
            !skill_ids.every((skill) => typeof skill === 'string' && validator.isUUID(skill))) {
            return next(appError(400, '欄位未填寫正確'));
        }

        const coachRepo = dataSource.getRepository('Coach');
        const findCoach = await coachRepo.findOneBy({ user_id: userInfo.id });
        if (!findCoach) {
            return next(appError(400, '使用者不存在'));
        }

        const result = await dataSource.transaction(async(manager) => {
            // 更新教練表
            const result = await manager.update(
                'Coach',
                { id: findCoach.id },
                { experience_years, description, profile_image_url }
            );

            // 更新 coach link skill
            await manager.delete('CoachLinkSkill', { coach_id: findCoach.id });
            const coachLinks = skill_ids.map((skill_id) => ({
                coach_id: findCoach.id,
                skill_id: skill_id
            }));
            await manager.insert('CoachLinkSkill', coachLinks);

            // 重新取得更新後教練資訊
            const newResult = await manager.findOneBy('Coach', { user_id: userInfo.id });

            const newResultLink = await manager.find('CoachLinkSkill', { where: { coach_id: newResult.id }});
            const skillIds = newResultLink ? newResultLink.map((skill) => skill.skill_id) : []

            return {
                id: newResult.id,
                experience_years: newResult.experience_years,
                description: newResult.description,
                profile_image_url: newResult.profile_image_url,
                skill_ids: skillIds
            };
        });
        res.json({
            status: 'success',
            data: result
        });
        return;
    },
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
            console.log(req.body);
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

module.exports = adminCoachController;
