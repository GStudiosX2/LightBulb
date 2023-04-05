import { readdirSync } from 'fs';
import { Socket, io } from 'socket.io-client';
import { LogLevel, log, log_level } from './console';

export type EventData = {
    name: string | string[],
    callback: (name: string, ...args: any[]) => void
}

export class GlassSocket {
    client: Socket | undefined;
    reconnectAttempts: number = 0;

    connect(token: string | undefined, baseUrl: string | undefined) {
        if (!token) {
            console.error('Please provide a token.');
            return;
        }

        if (!baseUrl) {
            console.error('Please provide a base_url');
            return;
        }

        this.client = io(baseUrl, {
            path: '/socket',
            auth: {
                token,
                type: 'PLUGIN',
                minecraft: 'UNKNOWN',
                version: '1.0.0'
            },
            autoConnect: false
        }).on("connect", () => {
            log(`Connected to glass websocket with reconnect attempts: ${this.reconnectAttempts}`);
            this.reconnectAttempts = 0;
        }).on("error", (data) => {
            log(`Error: ${data[0]}`);
        }).on("disconnect", (reason, description) => {
            log(`Connection to "${baseUrl}" was closed for: ${reason}`);
            log(`Error Description: ${description}`);
            log(`Trying to reconnect in 5 seconds attempt ${this.reconnectAttempts}.`);

            if (this.reconnectAttempts === 5) {
                this.close();
                process.exit(0);
            }
        
            setTimeout(() => {
                this.reconnectAttempts++;

                this.close();
                this.connect(token, baseUrl);
            }, 5000);
        });

        readdirSync(__dirname + '/events').forEach(async (event) => {
            const data = (await import(`./events/${event}`)).default;
            if (this.client) {
                if (data.name && data.callback) {
                    const event = data as EventData;
                    if (typeof event.name === 'string') {
                        this.client.on(event.name, (...args: any[]) => {
                            event.callback(event.name as string, args);
                        });
                    } else {
                        for (const name of event.name) {
                            this.client.on(name, (...args: any[]) => {
                                event.callback(name, args);
                            });
                        }
                    }
                } else if (data.name) {
                    if (typeof data.name === 'string') {
                        this.client.on(data.name, (...args: any[]) => {
                            args[args.length - 1](false);
                        });
                    } else {
                        for (const name of data.name) {
                            this.client.on(name, (...args: any[]) => {
                                args[args.length - 1](false);
                            });
                        }
                    }
                }
            }
        });

        this.client.connect();
    }

    sendLog(logType: LogLevel, log: string) {
        if (this.client) {
            this.client.emit("CONSOLE_LOG", JSON.stringify(log_level(logType, log)));
        }
    }

    close() {
        if (this.client) {
            this.client.close();
        }
    }
}