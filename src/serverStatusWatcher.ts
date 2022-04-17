import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { Server, ServerStatus } from './api.js';
import { LostArkServerName } from './constants.js';
import { Subscription } from './subscription.js';

export type ChangeCallback = (changes: Change<Server>[]) => void;

export interface Change<T> {
    currentValue: T;
    previousValue: T | null;
}

export class ServerStatusWatcher {
    private origin;
    private delay = 5000;
    private timeout: NodeJS.Timeout | null = null;
    private subscribers: Map<string, ChangeCallback> = new Map();
    private previousValues: Map<LostArkServerName, Server> = new Map();
    private isRunning = false;

    public constructor(origin: string) {
        this.origin = origin;
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

    private async checkStatus() {
        const response = await fetch(`${this.origin}/server-status`);
        const servers = (await response.json()) as Server[];

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
