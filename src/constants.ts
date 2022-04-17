export type LostArkRegionName =
    | 'North America West'
    | 'North America East'
    | 'Europe Central'
    | 'Europe West'
    | 'South America';

export const LOST_ARK_REGIONS: { fullName: LostArkRegionName; shortName: string }[] = [
    { fullName: 'North America West', shortName: 'NAW' },
    { fullName: 'North America East', shortName: 'NAE' },
    { fullName: 'Europe Central', shortName: 'EUC' },
    { fullName: 'Europe West', shortName: 'EUW' },
    { fullName: 'South America', shortName: 'SA' },
];

export type LostArkServerName =
    | 'Mari'
    | 'Valtan'
    | 'Enviska'
    | 'Akkan'
    | 'Bergstrom'
    | 'Shandi'
    | 'Rohendel'
    | 'Azena'
    | 'Una'
    | 'Regulus'
    | 'Avesta'
    | 'Galatur'
    | 'Karta'
    | 'Ladon'
    | 'Kharmine'
    | 'Elzowin'
    | 'Sasha'
    | 'Adrinne'
    | 'Aldebaran'
    | 'Zosma'
    | 'Vykas'
    | 'Danube'
    | 'Neria'
    | 'Kadan'
    | 'Trixion'
    | 'Calvasus'
    | 'Thirain'
    | 'Zinnervale'
    | 'Asta'
    | 'Wei'
    | 'Slen'
    | 'Sceptrum'
    | 'Procyon'
    | 'Beatrice'
    | 'Inanna'
    | 'Thaemine'
    | 'Sirius'
    | 'Antares'
    | 'Brelshaza'
    | 'Nineveh'
    | 'Mokoko'
    | 'Rethramis'
    | 'Tortoyk'
    | 'Moonkeep'
    | 'Stonehearth'
    | 'Shadespire'
    | 'Tragon'
    | 'Petrania'
    | 'Punika'
    | 'Kazeros'
    | 'Agaton'
    | 'Gienah'
    | 'Arcturus'
    | 'Yorn'
    | 'Feiton'
    | 'Vern'
    | 'Kurzan'
    | 'Prideholme';

export const LOST_ARK_SERVERS: { name: LostArkServerName; region: LostArkRegionName }[] = [
    {
        name: 'Mari',
        region: 'North America West',
    },
    {
        name: 'Valtan',
        region: 'North America West',
    },
    {
        name: 'Enviska',
        region: 'North America West',
    },
    {
        name: 'Akkan',
        region: 'North America West',
    },
    {
        name: 'Bergstrom',
        region: 'North America West',
    },
    {
        name: 'Shandi',
        region: 'North America West',
    },
    {
        name: 'Rohendel',
        region: 'North America West',
    },
    {
        name: 'Azena',
        region: 'North America East',
    },
    {
        name: 'Una',
        region: 'North America East',
    },
    {
        name: 'Regulus',
        region: 'North America East',
    },
    {
        name: 'Avesta',
        region: 'North America East',
    },
    {
        name: 'Galatur',
        region: 'North America East',
    },
    {
        name: 'Karta',
        region: 'North America East',
    },
    {
        name: 'Ladon',
        region: 'North America East',
    },
    {
        name: 'Kharmine',
        region: 'North America East',
    },
    {
        name: 'Elzowin',
        region: 'North America East',
    },
    {
        name: 'Sasha',
        region: 'North America East',
    },
    {
        name: 'Adrinne',
        region: 'North America East',
    },
    {
        name: 'Aldebaran',
        region: 'North America East',
    },
    {
        name: 'Zosma',
        region: 'North America East',
    },
    {
        name: 'Vykas',
        region: 'North America East',
    },
    {
        name: 'Danube',
        region: 'North America East',
    },
    {
        name: 'Neria',
        region: 'Europe Central',
    },
    {
        name: 'Kadan',
        region: 'Europe Central',
    },
    {
        name: 'Trixion',
        region: 'Europe Central',
    },
    {
        name: 'Calvasus',
        region: 'Europe Central',
    },
    {
        name: 'Thirain',
        region: 'Europe Central',
    },
    {
        name: 'Zinnervale',
        region: 'Europe Central',
    },
    {
        name: 'Asta',
        region: 'Europe Central',
    },
    {
        name: 'Wei',
        region: 'Europe Central',
    },
    {
        name: 'Slen',
        region: 'Europe Central',
    },
    {
        name: 'Sceptrum',
        region: 'Europe Central',
    },
    {
        name: 'Procyon',
        region: 'Europe Central',
    },
    {
        name: 'Beatrice',
        region: 'Europe Central',
    },
    {
        name: 'Inanna',
        region: 'Europe Central',
    },
    {
        name: 'Thaemine',
        region: 'Europe Central',
    },
    {
        name: 'Sirius',
        region: 'Europe Central',
    },
    {
        name: 'Antares',
        region: 'Europe Central',
    },
    {
        name: 'Brelshaza',
        region: 'Europe Central',
    },
    {
        name: 'Nineveh',
        region: 'Europe Central',
    },
    {
        name: 'Mokoko',
        region: 'Europe Central',
    },
    {
        name: 'Rethramis',
        region: 'Europe West',
    },
    {
        name: 'Tortoyk',
        region: 'Europe West',
    },
    {
        name: 'Moonkeep',
        region: 'Europe West',
    },
    {
        name: 'Stonehearth',
        region: 'Europe West',
    },
    {
        name: 'Shadespire',
        region: 'Europe West',
    },
    {
        name: 'Tragon',
        region: 'Europe West',
    },
    {
        name: 'Petrania',
        region: 'Europe West',
    },
    {
        name: 'Punika',
        region: 'Europe West',
    },
    {
        name: 'Kazeros',
        region: 'South America',
    },
    {
        name: 'Agaton',
        region: 'South America',
    },
    {
        name: 'Gienah',
        region: 'South America',
    },
    {
        name: 'Arcturus',
        region: 'South America',
    },
    {
        name: 'Yorn',
        region: 'South America',
    },
    {
        name: 'Feiton',
        region: 'South America',
    },
    {
        name: 'Vern',
        region: 'South America',
    },
    {
        name: 'Kurzan',
        region: 'South America',
    },
    {
        name: 'Prideholme',
        region: 'South America',
    },
];
