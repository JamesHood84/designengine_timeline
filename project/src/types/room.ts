export type RoomType = 'Bedroom' | 'Bathroom' | 'Kitchen' | 'Living' | 'Dining' | 'Other';

export type WallFinishType = 'Paint - Matt' | 'Paint - Eggshell' | 'Paint - Gloss' | 'Wallpaper - Standard' | 'Wallpaper - Premium' | 'Tiles - Ceramic' | 'Tiles - Porcelain' | 'Wood Paneling' | 'Stone Cladding';

export type FloorFinishType = 'Carpet - Standard' | 'Carpet - Premium' | 'Hardwood - Oak' | 'Hardwood - Walnut' | 'Laminate' | 'Luxury Vinyl Tiles' | 'Tiles - Ceramic' | 'Tiles - Porcelain' | 'Polished Concrete' | 'Natural Stone';

export type CeilingFinishType = 'Paint - Matt' | 'Paint - Anti-Mould' | 'Suspended Ceiling' | 'Wood Paneling' | 'Stretch Ceiling' | 'Acoustic Panels';

export interface Finish {
  type: string;
  materialCost: number;
  labourCost: number;
}

export interface RoomDimensions {
  length: number;
  width: number;
  wallHeight: number;
}

export interface RoomAreas {
  wall: number;
  floor: number;
  ceiling: number;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  description?: string;
  dimensions: RoomDimensions;
  areas: RoomAreas;
  finishes: {
    wall: Finish;
    floor: Finish;
    ceiling: Finish;
  };
}