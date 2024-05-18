import { format, createLogger, transports } from 'winston';
import { rootDir } from './utils';
import path from 'path';

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
        new transports.File({ filename: path.join(rootDir, './bot.log') }),
    ],
});
