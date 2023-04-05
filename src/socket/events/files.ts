import { 
    copyFileSync, cpSync,
    existsSync, mkdirSync, 
    readFileSync, readdirSync, 
    renameSync, rmSync, 
    statSync, createReadStream, 
    unlinkSync, writeFileSync
} from "fs";
import path from "path";
import { START_DIR, socket } from "../..";
import { v4 as uuidv4 } from "uuid";
import archiver from "archiver";
import { FileLocation, FileData } from "../../types";

export const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

export function resolve(location: FileLocation) : FileLocation {
    return {
        path: path.resolve(START_DIR, location.path.startsWith('/') ? location.path.substring(1) : location.path),
        root: false
    };
}

export function fetchFile(location: FileLocation, grabContent?: boolean, recurseDirs: boolean = true) : FileData | undefined {
    const newLocation = resolve(location);

    if (!newLocation.path.startsWith(START_DIR) || !existsSync(newLocation.path)) {
        return { name: newLocation.path, directory: false, accessible: false, error: "File does not exist" };
    }

    const stat = statSync(newLocation.path);
    const name = newLocation.path.substring(newLocation.path.lastIndexOf(path.sep) + 1);
    const size = stat.size;
    
    if (stat.isDirectory()) {
        return { 
            name, directory: true, accessible: true, size, 
            children: recurseDirs ? readdirSync(newLocation.path).map((file) => fetchFile({
                path: `${newLocation.path}/${file}`,
                root: false
            }, true, false)).filter((child) => child !== undefined) as FileData[] : []
        };
    }

    return {
        name, directory: false, accessible: true,
        size, content: (!grabContent ? (stat.size > MAX_FILE_SIZE 
            ? "File is too large to be displayed" 
            : readFileSync(newLocation.path).toString()) : "")
    };
}

export default {
    name: [
        'ALL_FILES', 'FETCH_FILE', // fetch
        'COPY_FILE', 'DOWNLOAD_FILE', 'DELETE_FILE', 'MOVE_FILE', // copy, download, delete, move
        'CREATE_FOLDER', 'CREATE_FILE',  // create
        'UPLOAD_FILE' // upload
    ],
    callback: (name: string, args: any[]) => {
        const ack = args[args.length - 1];

        switch (name) {
            case 'ALL_FILES': {
                const location: FileLocation = JSON.parse(args[0]);
                const newLocation = resolve(location);

                if (!existsSync(newLocation.path)) {
                    return;
                }

                ack(JSON.stringify(readdirSync(newLocation.path).map((file) => fetchFile({
                    path: `${newLocation.path}/${file}`,
                    root: false
                })).filter((value) => value != undefined) as FileData[]));
                break;
            }

            case 'FETCH_FILE': {
                const location: FileLocation = JSON.parse(args[0]);
                ack(JSON.stringify(fetchFile(location)));
                break;
            }

            case 'COPY_FILE': {
                const from: FileLocation = resolve(JSON.parse(args[0]));
                const to: FileLocation = resolve(JSON.parse(args[1]));

                if (statSync(from.path).isDirectory()) {
                    cpSync(from.path, to.path, { recursive: true });
                } else {
                    copyFileSync(from.path, to.path);
                }

                ack();
                break;
            }

            case 'MOVE_FILE': {
                const from: FileLocation = resolve(JSON.parse(args[0]));
                const to: FileLocation = resolve(JSON.parse(args[1]));
                renameSync(from.path, to.path);
                ack();
                break;
            }

            case 'CREATE_FOLDER': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                ack((() => {
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

                ack();
                break;
            }

            case 'DELETE_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));

                if (existsSync(location.path)) {
                    if (statSync(location.path).isDirectory()) {
                        rmSync(location.path, { recursive: true });
                    } else {
                        unlinkSync(location.path);
                    }
                }

                ack();
                break;
            }

            case 'UPLOAD_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));
                const id: string = args[1];

                if (!existsSync(location.path)) {
                    writeFileSync(location.path, '');
                }
                
                if (socket.client) {
                    let buffers: Buffer[] = [];
                    const listener = (buffer: Buffer) => { buffers.push(buffer); }
                    socket.client.on(`BUFFER-${id}`, listener);
                    socket.client.once(`EOF-${id}`, () => {
                        if (socket.client) {
                            socket.client.off(`BUFFER-${id}`, listener);
                        }
                        writeFileSync(location.path, Buffer.concat(buffers));
                    });
                }
                break;
            }

            case 'DOWNLOAD_FILE': {
                const location: FileLocation = resolve(JSON.parse(args[0]));

                if (!existsSync(location.path)) {
                    return;
                }

                const id = uuidv4();
                const room = `download-${id}`;

                const stat = statSync(location.path);

                // TODO: cleanup this
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
                break;
            }
        }
    }
}