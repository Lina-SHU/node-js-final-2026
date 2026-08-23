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
    }
};

module.exports = adminCoachController;
