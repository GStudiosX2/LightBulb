import { socket } from "..";
import { ConsoleLog, LogLevel, LogOptions } from "../types";

export const PREFIX = '§7[§bGLASS STANDALONE§7]';
export const CONSOLE_LOGS: ConsoleLog[] = [];

let maxLogs = 500;

export function setMaxLogs(ml: number) {
    maxLogs = ml <= 0 ? 1 : ml;
}

export function log_level(level: LogLevel, text: string) : ConsoleLog {
    return {
        timestamp: Date.now().toString(),
        log: { log: text, level }
    };
}

export function log_info(text: string) : ConsoleLog {
    return log_level('INFO', text);
}

export function log_warn(text: string) : ConsoleLog {
    return log_level('WARN', text);
}

export function log_servere(text: string) : ConsoleLog {
    return log_level('SERVERE', text);
}

// TODO: below needs some cleanup
export function info(text: string, options?: LogOptions) {
    if (CONSOLE_LOGS.length > maxLogs) {
        CONSOLE_LOGS.shift();
    }

    const str = `${options?.prefix === undefined ? `${PREFIX} §7[INFO§7]` : options?.prefix} §r${text}`;
    CONSOLE_LOGS.push(log_info(str));
    console.log(`[GLASS] [INFO] ${text}`);

    if (options?.send) {
        socket.sendLog('INFO', str);
    }
}

export function warn(text: string, options?: LogOptions) {
    if (CONSOLE_LOGS.length > maxLogs) {
        CONSOLE_LOGS.shift();
    }

    const str = `${options?.prefix === undefined ? `${PREFIX} §e[WARN]` : options?.prefix} §e${text}`;
    CONSOLE_LOGS.push(log_warn(str));
    console.warn(`[GLASS] [WARN] ${text}`);

    if (options?.send) {
        socket.sendLog('WARN', str);
    }
}

export function servere(text: string, options?: LogOptions) {
    if (CONSOLE_LOGS.length > maxLogs) {
        CONSOLE_LOGS.shift();
    }

    const str = `${options?.prefix === undefined ? `${PREFIX} §e[SERVERE]` : options?.prefix} §e${text}`;
    CONSOLE_LOGS.push(log_servere(str));
    console.error(`[GLASS] [ERROR] ${text}`);

    if (options?.send) {
        socket.sendLog('SERVERE', str);
    }
}