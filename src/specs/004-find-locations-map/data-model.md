# Phase 1: Data Model & Interfaces

Since this feature relies on static, hardcoded data and does not communicate with a backend database, the "Data Model" refers strictly to the TypeScript interfaces used within the React application to represent the static map points.

## Interfaces

```typescript
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
}
```

## Static Data Definition

The application will hold a constant array adhering to the `MapMarker[]` interface representing exactly 7 locations:

1. **LifeLine HQ**: `[106.682472, 10.762861]` (Type: `HQ`)
2. **Trung Tâm Hiến Máu Nhân Đạo Tp.HCM**: `[106.6544639, 10.7769653]` (Type: `DonationCenter`)
3. **Bệnh viện Truyền máu Huyết học**: `[106.665875, 10.7565468]` (Type: `DonationCenter`)
4. **Điểm hiến máu 466 Nguyễn Thị Minh Khai**: `[106.688564, 10.7727914]` (Type: `DonationCenter`)
5. **Điểm hiến máu 24 Nguyễn Thị Diệu**: `[106.6882594, 10.7754837]` (Type: `DonationCenter`)
6. **Bệnh viện Ung Bướu TP. HCM**: `[106.7739255, 10.8448994]` (Type: `DonationCenter`)
7. **AEON MALL BÌNH TÂN**: `[106.6117959, 10.7427835]` (Type: `DonationCenter`)

*(Note: Goong/Leaflet uses `[lat, lng]` internally. The spec coordinates given are `[lng, lat]` format or vice-versa depending on the tool. For example, `10.76...` is Latitude, `106...` is Longitude. The implementation will correctly parse these as `lat` and `lng`).*
