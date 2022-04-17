import { LostArkServerName } from './constants.js';

export class Watch {
    public userId: string;
    public servers: LostArkServerName[];

    public constructor(userId: string, servers: LostArkServerName[]) {
        this.userId = userId;
        this.servers = servers;
    }
}
