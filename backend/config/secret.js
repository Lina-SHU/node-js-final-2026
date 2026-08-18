module.exports = {
    jwtSerect: process.env.JWT_SECRET || 'node2026',
    jwtExpiresDay: process.env.JWT_EXPIRES_DAY || '30d'
};
