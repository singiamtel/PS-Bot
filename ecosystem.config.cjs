const path = require('path');

module.exports = {
    apps: [{
        name: 'Showdown bot',
        script: path.join(__dirname, './dist/main.js'),
        cron_restart: '0 */12 * * *',
        env: {
            NODE_ENV: 'production',
        },
    }],
};
