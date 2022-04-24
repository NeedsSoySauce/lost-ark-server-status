/* eslint-disable no-console */
import {
    inlineCode,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder
} from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Client, Collection, CommandInteraction, Intents, MessageEmbed } from 'discord.js';
import humanizeDuration from 'humanize-duration';
import { EOL } from 'os';
import { Server, ServerStatus } from './api.js';
import { LostArkServerName, LOST_ARK_REGIONS, LOST_ARK_SERVERS } from './constants.js';
import { MongoDatabase } from './database.js';
import { Change, ServerStatusWatcher } from './serverStatusWatcher.js';
import { Subscription } from './subscription.js';
import { Watch } from './watch.js';

export interface DeployParams {
    applicationId: string;
    guildId?: string | null;
    token: string;
    deployApplicationCommands?: boolean;
}

type CommandHandler = (interaction: CommandInteraction) => Promise<void>;

interface BotCommand {
    handler: CommandHandler;
    builder: SlashCommandBuilder;
}

export interface BotConstructorParameters {
    db: MongoDatabase;
    watcher: ServerStatusWatcher;
    dryRun?: boolean;
}

export class Bot extends Client {
    private commands: Map<string, BotCommand> = new Map();
    private db: MongoDatabase;
    private watcherSubscription: Subscription | null = null;
    private dailyResetHourUtc = 10; // 10 AM
    private updateActivityTimeout: NodeJS.Timeout | null = null;
    private updateActivityDelay = 5000;
    private dryRun = false;

    public constructor(params: BotConstructorParameters) {
        super({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            ],
            partials: ['CHANNEL'],
        });
        const { db, watcher, dryRun } = params;

        this.db = db;
        this.watcherSubscription = watcher.subscribe(this.handleChanges.bind(this));
        this.dryRun = dryRun ?? false;;

        const watchCommandBuilder = new SlashCommandBuilder()
            .setName('watch')
            .setDescription("Get notified when a server's status changes");

        const unwatchCommandBuilder = new SlashCommandBuilder()
            .setName('unwatch')
            .setDescription("Stop getting notified when a server's status changes");

        LOST_ARK_REGIONS.forEach(({ fullName, shortName }) => {
            const choices: [string, string][] = LOST_ARK_SERVERS.filter((s) => s.region === fullName)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => [s.name, s.name]);

            const createSlashCommandSubcommandBuilder = (commandDescription: string, optionDescription: string) =>
                new SlashCommandSubcommandBuilder()
                    .addStringOption(
                        new SlashCommandStringOption()
                            .addChoices(choices)
                            .setRequired(true)
                            .setName('server')
                            .setDescription(optionDescription),
                    )
                    .setName(shortName.toLowerCase())
                    .setDescription(commandDescription);

            watchCommandBuilder.addSubcommand(
                createSlashCommandSubcommandBuilder(
                    `Get notified when a server on ${fullName} changes it's status`,
                    'Name of the server to monitor for changes',
                ),
            );

            unwatchCommandBuilder.addSubcommand(
                createSlashCommandSubcommandBuilder(
                    `Stop getting notified when a server on ${fullName} changes it's status`,
                    'Name of the server to stop monitoring for changes',
                ),
            );
        });

        this.registerCommands([
            {
                builder: new SlashCommandBuilder().setName('debug').setDescription('Print debug information'),
                handler: this.handleDebugCommand.bind(this),
            },
            {
                builder: new SlashCommandBuilder().setName('help').setDescription('List available commands'),
                handler: this.handleHelpCommand.bind(this),
            },
            {
                builder: watchCommandBuilder,
                handler: this.handleWatchCommand.bind(this),
            },
            {
                builder: unwatchCommandBuilder,
                handler: this.handleUnwatchCommand.bind(this),
            },
            {
                builder: new SlashCommandBuilder()
                    .setName('watches')
                    .setDescription('List servers you are currently subscribed to'),
                handler: this.handleWatchesCommand.bind(this),
            },
            {
                builder: new SlashCommandBuilder()
                    .setName('reset')
                    .setDescription('Print time until daily reset'),
                handler: this.handleResetCommand.bind(this),
            },
        ]);

        this.once('ready', this.onReady.bind(this));
        this.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;
            const { commandName } = interaction;
            const command = this.commands.get(commandName);
            if (!command) throw new Error(`Failed to find handler for command with name '${commandName}'`);
            console.log(`Executing command '/${commandName}'`);
            command.handler(interaction);
        });
    }

    private handleChanges(changes: Change<Server>[]) {
        if (!this.isReady()) return;

        const serversInMaintenance = changes
            .filter((s) => s.currentValue.status === ServerStatus.Maintenance)
            .map((s) => s.currentValue.name);
        const serversPreviouslyInMaintenance = changes
            .filter((s) => s.previousValue?.status === ServerStatus.Maintenance)
            .map((s) => s.currentValue.name);

        serversInMaintenance.forEach((s) => this.notifyUsersWatchingServer(s, `${s} is now under maintenance`));
        serversPreviouslyInMaintenance.forEach((s) => this.notifyUsersWatchingServer(s, `${s} is no longer under maintenance`));
    }

    private async notifyUsersWatchingServer(serverName: LostArkServerName, message: string) {
        const userIds = await this.db.getUsersWatchingServer(serverName);
        await Promise.allSettled(
            userIds.map(async (id) => {
                const user = await this.users.fetch(id);

                if (this.dryRun) {
                    console.log({ serverName, userId: id, message })
                    return Promise.resolve();
                }

                return user.send({
                    embeds: [new MessageEmbed({ description: message })],
                });
            }))
    }

    private getMillisecondsToReset(): number {
        const reset = new Date();
        if (reset.getUTCHours() < this.dailyResetHourUtc) {
            reset.setUTCHours(this.dailyResetHourUtc, 0, 0, 0)
        } else {
            reset.setDate(reset.getDate() + 1)
            reset.setUTCHours(this.dailyResetHourUtc, 0, 0, 0)
        }
        return reset.getTime() - new Date().getTime()
    }

    private handleResetCommand(interaction: CommandInteraction) {
        const remainingTime = humanizeDuration(this.getMillisecondsToReset(), { conjunction: ' and ', round: true })
        const description = `Daily reset is in ${remainingTime} (10 AM UTC)`
        return interaction.reply({
            embeds: [new MessageEmbed({ description })],
            ephemeral: true
        })
    }

    private handleDebugCommand(interaction: CommandInteraction) {
        return interaction.reply({ content: 'Hello world!', ephemeral: true });
    }

    private handleHelpCommand(interaction: CommandInteraction) {
        const commandBuilders = Array.from(this.commands.values()).map((command) => command.builder);
        const description = commandBuilders
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => `${inlineCode(`/${s.name}`)} - ${s.description}`)
            .join('\n');
        return interaction.reply({
            embeds: [new MessageEmbed({ description })],
            ephemeral: true,
        });
    }

    private async handleWatchesCommand(interaction: CommandInteraction) {
        const userId = interaction.user.id;
        const watch = await this.db.getWatchByUserId(userId);

        const description = watch?.servers.length
            ? `You are currently setup to be notified when one of the following servers changes it's maintenance status:\n\n${watch.servers
                .sort((a, b) => a.localeCompare(b))
                .map((s) => ` • ${s}`)
                .join('\n')}`
            : `You haven't created any watches. Use ${inlineCode('/watch')} to create one.`;

        await interaction.reply({
            embeds: [new MessageEmbed({ description })],
            ephemeral: true,
        });
    }

    private async handleWatchCommand(interaction: CommandInteraction) {
        const userId = interaction.user.id;
        const serverName = interaction.options.getString('server', true) as LostArkServerName;
        const watch = new Watch(userId, [serverName]);
        const region = interaction.options.getSubcommand();

        await this.db.addOrUpdateWatch(watch);

        const description = `You will be notified when ${serverName} goes into or out of maintenance.
        
        Use ${inlineCode(`/unwatch ${region} ${serverName}`)} to stop getting notified.`;

        await interaction.reply({
            embeds: [new MessageEmbed({ description })],
            ephemeral: true,
        });
    }

    private async handleUnwatchCommand(interaction: CommandInteraction) {
        const userId = interaction.user.id;
        const serverName = interaction.options.getString('server', true) as LostArkServerName;

        const isDeletedOrUpdated = await this.db.deleteWatch(userId, [serverName]);

        const description = isDeletedOrUpdated
            ? `You will no longer be notified when ${serverName} goes into or out of maintenance.`
            : `You don't have a watch for ${serverName}. Did you intend to unwatch another server?`;

        await interaction.reply({
            embeds: [new MessageEmbed({ description })],
            ephemeral: true,
        });
    }

    private registerCommands(commands: BotCommand[]) {
        commands.forEach((command) => this.registerCommand(command));
    }

    private registerCommand({ builder, handler }: BotCommand) {
        if (this.commands.has(builder.name)) {
            throw new Error(`A command with name '${builder.name}' has already been registered`);
        }
        this.commands.set(builder.name, {
            builder,
            handler,
        });
    }

    private async onReady() {
        console.log(`Logged in as '${this.user?.username}#${this.user?.discriminator}'`);
        this.updateActivity();
    }

    private updateActivity() {
        const duration = humanizeDuration(this.getMillisecondsToReset(), {
            largest: 1,
            round: true,
            units: ['h', 'm', 's']
        });
        this.user?.setActivity({
            name: `reset in ${duration}`
        })

        setTimeout(this.updateActivity.bind(this), this.updateActivityDelay)
    }

    public async teardown() {
        const applicationCommands = (await this.application?.commands.fetch()) ?? new Collection();

        console.log(`Found ${applicationCommands.size} application command(s)`);

        const guilds = await this.guilds.fetch();
        const applicationGuildCommands = (
            await Promise.allSettled(
                guilds.map(async (guild) => {
                    const fullGuild = await guild.fetch();
                    return fullGuild.commands.fetch();
                }),
            )
        ).flatMap((s) => (s.status === 'fulfilled' ? Array.from(s.value.values()) : []));

        console.log(`Found ${applicationGuildCommands.length} application guild command(s)`);

        const deleteApplicationCommandResults = await Promise.allSettled(
            applicationCommands.mapValues((value) => value.delete()),
        );

        console.log(
            `Deleted ${deleteApplicationCommandResults.filter((s) => s.status === 'fulfilled').length
            } application command(s)`,
        );

        const deleteApplicationGuildCommandResults = await Promise.allSettled(
            applicationGuildCommands.map((value) => value.delete()),
        );

        console.log(
            `Deleted ${deleteApplicationGuildCommandResults.filter((s) => s.status === 'fulfilled').length
            } application guild command(s)`,
        );
    }

    public async deploy(params: DeployParams) {
        const { applicationId, guildId, token, deployApplicationCommands } = params;
        const rest = new REST({ version: '9' }).setToken(token);
        const commandBuilders = Array.from(this.commands.values()).map((command) => command.builder);

        console.log('Started refreshing application (/) commands.');

        console.log(`Found ${commandBuilders.length} command(s):`);
        console.log(`${commandBuilders.map((command) => `/${command.name}`).join(EOL)}`);

        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
                body: commandBuilders.map((command) => command.toJSON()),
            });
        }

        if (deployApplicationCommands) {
            await rest.put(Routes.applicationCommands(applicationId), {
                body: commandBuilders.map((command) => command.toJSON()),
            });
        }

        console.log('Successfully reloaded application (/) commands.');
    }

    public destroy() {
        super.destroy();
        this.watcherSubscription?.unsubscribe();
        this.watcherSubscription = null;

        if (this.updateActivityTimeout) {
            clearTimeout(this.updateActivityTimeout);
            this.updateActivityTimeout = null;
        }
    }
}
