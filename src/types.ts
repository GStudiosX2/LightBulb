// CONSOLE
export type LogLevel = 'INFO' | 'WARN' | 'SERVERE';

export type Log = {
    log: string,
    level: LogLevel
}

export type ConsoleLog = {
    timestamp: string,
    log: Log
}

// LOG
export type LogOptions = {
    prefix?: string,
    send?: boolean
}

// FILE
export type FileLocation = {
    path: string,
    root: boolean
}

export type FileData = {
    name: string,
    directory: boolean,
    accessible: boolean,
    size?: number,
    content?: string,
    children?: FileData[],
    error?: String
}

// COMMAND
export type Command = {
    user: string,
    original: string,
    command: string
};

// PLAYER
export type TinyPlayer = {
    name: string,
    uuid: string,
    opped: boolean,
    whitelisted: boolean,
    online: boolean,
}