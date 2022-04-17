/* eslint-disable no-console */
import { Collection, MongoClient, MongoServerError } from 'mongodb';
import { LostArkServerName } from './constants.js';
import { Watch } from './watch.js';

export class MongoDatabase {
    private client: MongoClient;
    private watches: Collection<Watch> | null = null;

    public constructor(uri: string) {
        this.client = new MongoClient(uri);
        this.client.once('open', this.onOpen.bind(this));
    }

    private onOpen() {
        console.log('MongoDatabase connected');
    }

    public async start() {
        await this.client.connect();
        this.watches = this.client.db().collection('watches');

        try {
            await this.watches.createIndex({ userId: 1 }, { unique: true });
        } catch (error) {
            console.error(
                "Failed to setup database. Make sure the specified database user has the 'readWrite' permission on the given database.'",
            );
            throw error;
        }
    }

    public stop() {
        return this.client.close();
    }

    public async addOrUpdateWatch(watch: Watch) {
        if (!this.watches) throw new Error('Watches collection has not been initialized');
        await this.watches.updateOne(
            {
                userId: watch.userId,
            },
            {
                $setOnInsert: {
                    userId: watch.userId,
                },
                $addToSet: {
                    servers: {
                        $each: watch.servers,
                    },
                },
            },
            {
                upsert: true,
            },
        );
    }

    public async getWatchByUserId(userId: string): Promise<Watch | null> {
        if (!this.watches) throw new Error('Watches collection has not been initialized');
        const watch = await this.watches.findOne({ userId });
        if (!watch) return null;
        return new Watch(watch.userId, watch.servers);
    }

    public getUsersWatchingServer(server: LostArkServerName) {
        if (!this.watches) throw new Error('Watches collection has not been initialized');
        return this.watches
            .find(
                {
                    servers: server,
                },
                {
                    projection: {
                        userId: 1,
                    },
                },
            )
            .map((s) => s.userId)
            .toArray();
    }

    public async deleteWatch(userId: string, servers?: LostArkServerName[]): Promise<boolean> {
        if (!this.watches) throw new Error('Watches collection has not been initialized');
        if (servers) {
            // Remove the specified servers
            const updateResult = await this.watches.updateOne(
                {
                    userId,
                },
                {
                    $pullAll: {
                        servers,
                    },
                },
            );
            return updateResult.modifiedCount > 0;
        }

        // Remove the whole document
        const deleteResult = await this.watches.deleteOne({
            userId,
        });
        return deleteResult.deletedCount > 0;
    }
}
