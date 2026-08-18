const app = require('../app');
const { dataSource } = require('../db/data-source');
const config = require('../config');

async function start () {
    try {
        await dataSource.initialize();
        console.log('資料庫連線成功');

        app.listen(config.get('web.port'), () => {
            console.log(`server 跑起來了：http://localhost:${config.get('web.port')}`);
        });
    } catch (err) {
        console.error('資料庫連線失敗', err);
        process.exit(1);
    }
};

start();
