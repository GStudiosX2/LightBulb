import { CONSOLE_LOGS } from "../console";
import * as out from "../console";
import { Command } from "../../types";
import { spawn } from "child_process";
import { START_DIR } from "../..";
import { ChildProcessWithoutNullStreams } from "child_process";
import { homedir } from "os";
import { sep } from "path";

let runningProgram: ChildProcessWithoutNullStreams | undefined;

export default {
    name: ['FETCH_CONSOLE_HISTORY', 'EXECUTE_COMMAND'],
    callback: (name: string, args: any[]) => {
        switch (name) {
            case 'FETCH_CONSOLE_HISTORY': {
                const [ack] = args;
                ack(JSON.stringify({ logs: CONSOLE_LOGS }));
                break;
            }

            case 'EXECUTE_COMMAND': {
                const command: Command = JSON.parse(args[0]);

                if (command.original.trim() === '') {
                    return;
                }

                const cmd_args = command.original.trim().split(' ');
                const cmd = cmd_args.shift();
                
                switch (cmd) {
                    case "start": {
                        if (!process.env.run_program) {
                            out.warn(`the command 'start' hasn't been enabled`, {
                                send: true
                            });
                            return;
                        }

                        if (runningProgram) {
                            runningProgram.kill();
                        }
                        
                        runningProgram = spawn('cmd.exe', ['/c', `${cmd_args.join(' ')}`], {
                            cwd: START_DIR
                        });

                        runningProgram.stdout.on('data', (data) => {
                            out.info(data.toString().replaceAll(homedir(), `${sep}home`), { send: true });
                        });
                          
                        runningProgram.stderr.on('data', (data) => {
                            out.servere(data.toString().replaceAll(homedir(), `${sep}home`), { send: true });
                        });
                          
                        runningProgram.on('exit', (code) => {
                            out.info(`Child exited with code ${code}`, { send: true });
                            runningProgram = undefined;
                        });

                        break;
                    }

                    case "kill": {
                        if (!process.env.run_program) {
                            out.warn(`the command 'kill' hasn't been enabled`, {
                                send: true
                            });
                            return;
                        }

                        if (runningProgram) {
                            runningProgram.kill();
                        }

                        break;
                    }
                }

                if (process.env.run_program && (runningProgram && runningProgram.stdin)) {
                    runningProgram.stdin.write(command.original + '\n');
                    return;
                }

                out.warn(`'EXECUTE_COMMAND' has not been implemented yet: ${JSON.stringify(command)}`, {
                    send: true
                });
                break;
            }
        }
    }
}