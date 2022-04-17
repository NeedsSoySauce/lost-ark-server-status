import express from 'express';
import rateLimit from 'express-rate-limit';
import { getServers } from './api.js';
import { ServerStatusWatcher } from './serverStatusWatcher.js';
import { Bot } from './bot.js';
import { MongoDatabase } from './database.js';
import { getEnvironmentVariable } from './util.js';

const app = express();
const port = getEnvironmentVariable('LOST_ARK_LOST_ARK_API_PORT');

const rateLimiter = rateLimit({
    standardHeaders: true,
    max: 20,
});

app.use(rateLimiter);

app.get('/server-status', async (req, res) => {
    res.json(await getServers());
});

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);

    const watcher = new ServerStatusWatcher(getEnvironmentVariable('LOST_ARK_LOST_ARK_API_ORIGIN'));
    watcher.start();

    const db = new MongoDatabase(getEnvironmentVariable('LOST_ARK_MONGODB_URI'));
    await db.start();

    const bot = new Bot(db, watcher);
    await bot.login(getEnvironmentVariable('LOST_ARK_DISCORD_TOKEN'));

    // await bot.deploy({
    //     applicationId: getEnvironmentVariable('LOST_ARK_DISCORD_APPLICATION_ID'),
    //     guildId: getEnvironmentVariable('LOST_ARK_DISCORD_GUILD_ID'),
    //     token: getEnvironmentVariable('LOST_ARK_DISCORD_TOKEN'),
    // });

    // await bot.teardown();
});
