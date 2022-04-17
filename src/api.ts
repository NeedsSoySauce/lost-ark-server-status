import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { LostArkRegionName, LostArkServerName } from './constants.js';

const url = 'https://www.playlostark.com/en-gb/support/server-status';

export enum ServerStatus {
    Good = 'GOOD',
    Busy = 'BUSY',
    Full = 'FULL',
    Maintenance = 'MAINTENANCE',
}

export interface Server {
    name: LostArkServerName;
    status: ServerStatus;
    region: LostArkRegionName;
}

const parseServer = (element: HTMLElement, region: string): Server => {
    const name = element.querySelector('.ags-ServerStatus-content-responses-response-server-name')?.textContent?.trim();

    if (!name) throw new Error('Failed to parse server name');

    const classlist = element.querySelector(
        '.ags-ServerStatus-content-responses-response-server-status-wrapper .ags-ServerStatus-content-responses-response-server-status',
    )?.classList;

    if (!classlist) throw new Error('Failed to parse classlist');

    const status = Object.entries(ServerStatus).find(([key]) =>
        classlist.contains(`ags-ServerStatus-content-responses-response-server-status--${key.toLowerCase()}`),
    )?.[1];

    if (!status) throw new Error('Failed to parse server status');

    return {
        name: name as LostArkServerName,
        status,
        region: region as LostArkRegionName,
    };
};

export const getServers = async (): Promise<Server[]> => {
    const result = await fetch(url);
    const text = await result.text();
    const jsdom = new JSDOM(text);

    const tabHeadings = jsdom.window.document.querySelectorAll<HTMLElement>(
        '.ags-ServerStatus-content-tabs .ags-ServerStatus-content-tabs-tabHeading',
    );

    const regions = Array.from(tabHeadings.values()).map((node) => {
        const { index } = node.dataset;
        const name = node.querySelector('.ags-ServerStatus-content-tabs-tabHeading-label')?.textContent?.trim();
        if (!name || !index) throw new Error('Failed to parse region');
        return {
            index,
            name,
        };
    });

    const regionMap = Object.fromEntries(regions.map((s) => [s.index, s.name]));

    const tabs = jsdom.window.document.querySelectorAll<HTMLElement>('.ags-ServerStatus-content-responses-response');

    const servers: Server[] = Array.from(tabs.values())
        .flatMap((node) => {
            const { index } = node.dataset;
            const responses = node.querySelectorAll<HTMLElement>('.ags-ServerStatus-content-responses-response-server');

            if (!index) throw new Error('Failed to parse server list');

            const regionName = regionMap[index];

            if (!regionName) throw new Error('Failed to parse region name');

            return Array.from(responses.values()).map((s) => parseServer(s, regionName));
        })
        .filter((s) => s !== null) as Server[];

    return servers;
};
