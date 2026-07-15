export type Location = { value: string; label: string };

export type LocationGroup = { label: string; locations: Location[] };

export type GetLocations = () => LocationGroup[];
