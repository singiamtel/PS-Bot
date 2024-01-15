module.exports = {
    apps: [{
        name: 'Showdown bot',
        script: 'dist/main.js',
        cron_restart: '0 */12 * * *',
        env: {
            NODE_ENV: 'production',
        },
    }],
};
