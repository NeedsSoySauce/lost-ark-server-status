import express from 'express';
import rateLimit from 'express-rate-limit';
import { getServers, ServerStatus } from './api.js';
import { Bot } from './bot.js';
import { LOST_ARK_SERVERS } from './constants.js';
import { MongoDatabase } from './database.js';
import { ServerStatusWatcher } from './serverStatusWatcher.js';
import { getEnvironmentVariable } from './util.js';

const app = express();
const port = getEnvironmentVariable('LOST_ARK_API_PORT');

const rateLimiter = rateLimit({
    standardHeaders: true,
    max: 20,
});

const watcher = new ServerStatusWatcher(getEnvironmentVariable('LOST_ARK_API_ORIGIN'));
const db = new MongoDatabase(getEnvironmentVariable('LOST_ARK_MONGODB_URI'));
const bot = new Bot(db, watcher);

app.use(rateLimiter);

app.post('/server-status', async (req, res) => {
    // For testing to force maintenance status
    LOST_ARK_SERVERS.forEach(server => {
        watcher.setPreviousValue(server.name, {
            ...server,
            status: ServerStatus.Maintenance
        })
    })
    res.json(watcher.getState())
});

app.get('/server-status', async (req, res) => {
    res.json(await getServers());
});

app.listen(port, async () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on port ${port}`);

    watcher.start()
    await db.start();
    await bot.login(getEnvironmentVariable('LOST_ARK_DISCORD_TOKEN'));

    // await bot.deploy({
    //     applicationId: getEnvironmentVariable('LOST_ARK_DISCORD_APPLICATION_ID'),
    //     guildId: getEnvironmentVariable('LOST_ARK_DISCORD_GUILD_ID'),
    //     token: getEnvironmentVariable('LOST_ARK_DISCORD_TOKEN'),
    // });

    // await bot.teardown();
});