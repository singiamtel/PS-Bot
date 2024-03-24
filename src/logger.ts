import { format, createLogger, transports } from 'winston';

export const logger = createLogger({
    level: 'verbose',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'bot.log' }),
    ],
});
