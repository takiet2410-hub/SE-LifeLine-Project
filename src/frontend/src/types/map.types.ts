export type LocationType = 'HQ' | 'DonationCenter';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  type: LocationType;
  workingHours?: string;
  badges?: string[];
}
