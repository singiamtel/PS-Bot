import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = __dirname;

let __config = {
    rooms: [],
    hostRoom: undefined,
    imageCDN: undefined,
};
const configPath = path.join(rootDir, '../config.json');
try {
    const data = fs.readFileSync(configPath, 'utf8');
    __config = JSON.parse(data);
} catch {
    fs.writeFileSync(configPath, JSON.stringify(__config, null, 2), 'utf8');
}

export const config = {
    prefix: process.env.prefix ?? '#',
    whitelist: process.env.whitelist?.split(',').map((x) => x.trim()) || [],
    rooms: __config.rooms,
    hostRoom: __config.hostRoom ?? 'botdevelopment',
    imageCDN: __config.imageCDN ?? 'https://cdn.crob.at/',
    name: process.env.botusername,
};
