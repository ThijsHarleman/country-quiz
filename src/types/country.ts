export type Continent =
    | 'Africa'
    | 'Asia'
    | 'Europe'
    | 'North America'
    | 'Oceania'
    | 'South America';

export interface Country {
    code: string;
    name: string;
    capital: string;
    continent: Continent;
    flag: string;
    flagSource: string;
}
