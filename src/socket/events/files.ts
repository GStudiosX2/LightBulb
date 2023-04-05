import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync } from "fs";
import path, { } from "path";
import { START_DIR, socket } from "../..";
import { writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import archiver from "archiver";

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

export function resolve(location: FileLocation) : FileLocation {
    return {
        path: path.resolve(START_DIR, location.path.startsWith('/') ? location.path.substring(1) : location.path),
        root: false
    }
}

export const MAX_FILE_SIZE = 3 * 1024 * 1024;

export function fetchFile(location: FileLocation) : FileData | undefined {
    const newLocation = resolve(location);

    if (!existsSync(newLocation.path)) {
        return undefined;
    }

    const stat = statSync(newLocation.path);
    const name = newLocation.path.substring(newLocation.path.lastIndexOf(path.sep) + 1);
    const size = stat.size;

    if (stat.isDirectory()) {
        const children = readdirSync(newLocation.path).map((file) => fetchFile({
            path: `${newLocation.path}/${file}`,
            root: false
        })).filter((value) => value != undefined) as FileData[];

        return {
            name,
            directory: true,
            accessible: true,
            size,
            children
        };
    } else {
        return {
            name,
            directory: false,
            accessible: true,
            size,
            content: stat.size > MAX_FILE_SIZE 
                ? "File is too large to be displayed" 
                : readFileSync(newLocation.path).toString()
        };
    }
}

export default {
    name: ['ALL_FILES', 'FETCH_FILE', 'COPY_FILE', 'CREATE_FOLDER', 'CREATE_FILE', 'UPLOAD_FILE', 'DOWNLOAD_FILE', 'DELETE_FILE', 'MOVE_FILE'],
    callback: (name: string, args: any[]) => {
        switch (name) {
            case 'ALL_FILES': {
                const location: FileLocation = JSON.parse(args[0]);
                const newLocation = resolve(location);

                if (!existsSync(newLocation.path)) {
                    return;
                }

                args[1](JSON.stringify(readdirSync(newLocation.path).map((file) => fetchFile({
                    path: `${newLocation.path}/${file}`,
                    root: false
                })).filter((value) => value != undefined) as FileData[]));

                break;
            }
            case 'FETCH_FILE': {
                const location: FileLocation = JSON.parse(args[0]);

                const file = fetchFile(location);
                args[1](JSON.stringify(file));

                break;
            }
            case 'COPY_FILE': {
                const from: FileLocation = resolve(JSON.parse(args[0]));
                const to: FileLocation = resolve(JSON.parse(args[1]));
                copyFileSync(from.path, to.path);
                args[2]();

                break;
            }
            case 'MOVE_FILE': {
                const from: FileLocation = resolve(JSON.parse(args[0]));
                const to: FileLocation = resolve(JSON.parse(args[1]));
                renameSync(from.path, to.path);
                args[2]();

                break;
            }
            case 'CREATE_FOLDER': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                args[1]((() => {
                    if (existsSync(location.path)) {
                        return false;
                    }
                    mkdirSync(location.path);
                    return true;
                })());

                break;
            }
            case 'CREATE_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                if (!existsSync(location.path)) {
                    writeFileSync(location.path, '');
                }
                args[1]();

                break;
            }
            case 'DELETE_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                if (existsSync(location.path)) {
                    unlinkSync(location.path);
                }
                args[1]();

                break;
            }
            case 'UPLOAD_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                const id: string = args[1];

                if (!existsSync(location.path)) {
                    writeFileSync(location.path, '');
                }
                
                if (socket.client) {
                    let buffer: string = '';
                    const listener = (args: any[]) => buffer += args.toString();

                    socket.client.on(`BUFFER-${id}`, listener);

                    socket.client.once(`EOF-${id}`, () => {
                        if (socket.client) {
                            socket.client.off(`BUFFER-${id}`, listener);
                        }
                        writeFileSync(location.path, buffer);
                    });
                }

                break;
            }
            case 'DOWNLOAD_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                const ack = args[1];

                if (!existsSync(location.path)) {
                    return;
                }

                const id = uuidv4();
                const room = `download-${id}`;

                const stat = statSync(location.path);
                if (stat.isDirectory()) {
                    const name = location.path.substring(location.path.lastIndexOf(path.sep) + 1);
                    const archive = archiver('zip', { zlib: { level: 9 } });
                    archive.on('finish', () => {
                        ack(id, archive.pointer());
                        archive.on('data', chunk => {
                            if (socket.client) {
                                socket.client.emit(`BUFFER-${room}`, chunk);
                            }
                        });
                        archive.on('end', () => {
                            if (socket.client) {
                                socket.client.emit(`EOF-${room}`);
                                archive.destroy();
                            }
                        });
                    });
                    archive.directory(location.path, name);
                    archive.finalize();
                } else {
                    ack(id, stat.size);
                    const stream = createReadStream(location.path);
                    stream.on('data', chunk => {
                        if (socket.client) {
                            socket.client.emit(`BUFFER-${room}`, chunk);
                        }
                    });
                    stream.on('end', () => {
                        if (socket.client) {
                            socket.client.emit(`EOF-${room}`);
                            stream.close();
                        }
                    });
                }
            }
        }
    }
}