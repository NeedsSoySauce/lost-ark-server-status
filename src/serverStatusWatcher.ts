import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { Server } from './api.js';
import { LostArkServerName } from './constants.js';
import { Subscription } from './subscription.js';

export type ChangeCallback = (changes: Change<Server>[]) => void;

export interface Change<T> {
    currentValue: T;
    previousValue: T | null;
}

export class ServerStatusWatcher {
    private origin;
    private delay: number;
    private timeout: NodeJS.Timeout | null = null;
    private subscribers: Map<string, ChangeCallback> = new Map();
    private previousValues: Map<LostArkServerName, Server> = new Map();
    private isRunning = false;

    public constructor(origin: string, delay: number | null = null) {
        this.origin = origin;
        this.delay = delay ?? 60000; // 60 seconds
    }

    public subscribe(callback: ChangeCallback): Subscription {
        const id = uuidv4();
        this.subscribers.set(id, callback);
        return new Subscription(() => this.subscribers.delete(id));
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.checkStatus();
    }

    public stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.timeout) clearTimeout(this.timeout);
    }

    public setPreviousValue(serverName: LostArkServerName, server: Server) {
        this.previousValues.set(serverName, server)
    }

    public getState() {
        return Array.from(this.previousValues.values())
    }

    private async checkStatus() {
        let servers: Server[];
        try {
            const response = await fetch(`${this.origin}/server-status`);
            servers = (await response.json()) as Server[];
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
            this.timeout = setTimeout(() => this.checkStatus(), this.delay);
            return;
        }

        const changes: Change<Server>[] = servers
            .map((s) => {
                const previousValue = this.previousValues.get(s.name) ?? null;
                const change: Change<Server> = {
                    currentValue: s,
                    previousValue,
                };
                return change;
            })
            .filter((s) => s.previousValue && s.previousValue.status !== s.currentValue.status);

        servers.forEach((s) => this.previousValues.set(s.name, s));

        if (changes.length) {
            this.subscribers.forEach((subscriber) => subscriber(changes));
        }

        if (!this.isRunning) return;

        this.timeout = setTimeout(() => this.checkStatus(), this.delay);
    }
}
