export type TinyPlayer = {
    name: string,
    uuid: string,
    opped: boolean,
    whitelisted: boolean,
    online: boolean,
}

export default {
    name: ['FETCH_PLAYERS', 'FETCH_BLACKLIST', 'FETCH_ADMINISTRATOR_PLAYERS', 'FETCH_WHITELISTED_PLAYERS'],
    callback: (_name: string, _args: any[]) => {
    }
}