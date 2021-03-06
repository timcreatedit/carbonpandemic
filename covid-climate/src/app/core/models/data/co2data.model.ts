export enum Countries {
  china = 'China',
  india = 'India',
  us = 'US',
  eu28 = 'EU27 & UK',
  russia = 'Russia',
  japan = 'Japan',
  brazil = 'Brazil',
  uk = 'UK',
  france = 'France',
  germany = 'Germany',
  italy = 'Italy',
  spain = 'Spain',
  rest = 'ROW',
  world = 'WORLD',
}

export enum Sectors {
  industry = 'Industry',
  groundTransport = 'Ground Transport',
  power = 'Power',
  residential = 'Residential',
  domesticAviation = 'Domestic Aviation',
  // internationalAviation = 'International Aviation',
}

export interface Co2Datapoint {
  country: Countries;
  date: Date;
  sector: Sectors;
  mtCo2: number;
}
