import { socket } from "..";

export type LevelType = 'INFO' | 'WARN' | 'SERVERE';

export type Log = {
    log: string,
    level: LevelType
}

export type ConsoleLog = {
    timestamp: string,
    log: Log
}

export const PREFIX = '§7[§bGLASS STANDALONE§7]';
export const CONSOLE_LOGS: ConsoleLog[] = [];

let maxLogs = 500;

export function setMaxLogs(ml: number) {
    ml = ml <= 0 ? 1 : ml;
    maxLogs = ml;
}

export function log_level(level: LevelType, text: string) : ConsoleLog {
    return {
        timestamp: Date.now().toString(),
        log: {
            log: text,
            level
        }
    }
}

export function info(text: string) : ConsoleLog {
    return log_level('INFO', text);
}

export function warn(text: string) : ConsoleLog {
    return log_level('WARN', text);
}

export function servere(text: string) : ConsoleLog {
    return log_level('SERVERE', text);
}

export type LogOptions = {
    prefix?: string,
    send?: boolean
}

export function log(text: string, options?: LogOptions) {
    if (CONSOLE_LOGS.length > maxLogs) {
        CONSOLE_LOGS.shift();
    }

    const str = `${options?.prefix === undefined ? `${PREFIX} §7[INFO§7]` : options?.prefix} §r${text}`;
    CONSOLE_LOGS.push(info(str));
    console.log(`[GLASS] [INFO] ${text}`);

    if (options?.send) {
        socket.sendLog('INFO', str);
    }
}

export function warning(text: string, options?: LogOptions) {
    if (CONSOLE_LOGS.length > maxLogs) {
        CONSOLE_LOGS.shift();
    }

    const str = `${options?.prefix === undefined ? `${PREFIX} §e[WARN]` : options?.prefix} §e${text}`;
    CONSOLE_LOGS.push(warn(str));
    console.warn(`[GLASS] [WARN] ${text}`);

    if (options?.send) {
        socket.sendLog('WARN', str);
    }
}

export function error(text: string, options?: LogOptions) {
    if (CONSOLE_LOGS.length > maxLogs) {
        CONSOLE_LOGS.shift();
    }

    const str = `${options?.prefix === undefined ? `${PREFIX} §e[SERVERE]` : options?.prefix} §e${text}`;
    CONSOLE_LOGS.push(servere(str));
    console.error(`[GLASS] [ERROR] ${text}`);

    if (options?.send) {
        socket.sendLog('SERVERE', str);
    }
}