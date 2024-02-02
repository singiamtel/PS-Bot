import * as winston from 'winston';

const myFormat = winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`);

export const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        myFormat
    ),
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error', 'warn'],
        }),
    ],
});
