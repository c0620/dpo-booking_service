export const FLOOR_OFFSETS: Record<number, number> = { 8: 0, 6: 238, 1: 476 };

export interface MapRoomRect {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
}

/** Статичные (небронируемые) комнаты — координаты из Figma node 60:2796 */
export const GRAY_ROOMS: MapRoomRect[] = [
  // 8 этаж
  { floor: 8, label: '801', x: 98, y: 24, width: 54, height: 58 },
  { floor: 8, label: '802', x: 164, y: 24, width: 54, height: 58 },
  { floor: 8, label: '803', x: 230, y: 24, width: 54, height: 58 },
  { floor: 8, label: '804', x: 418, y: 24, width: 54, height: 58 },
  { floor: 8, label: '805', x: 484, y: 24, width: 54, height: 58 },
  { floor: 8, label: '806', x: 550, y: 24, width: 54, height: 58 },
  { floor: 8, label: '813', x: 220, y: 132, width: 54, height: 58 },
  { floor: 8, label: '814', x: 154, y: 132, width: 54, height: 58 },
  { floor: 8, label: '812', x: 286, y: 132, width: 54, height: 58 },
  { floor: 8, label: '811', x: 352, y: 132, width: 54, height: 58 },
  { floor: 8, label: '810', x: 418, y: 132, width: 54, height: 58 },
  { floor: 8, label: '809', x: 484, y: 132, width: 54, height: 58 },
  { floor: 8, label: '808', x: 550, y: 132, width: 54, height: 58 },
  // 6 этаж
  { floor: 6, label: '601', x: 98, y: 24, width: 54, height: 58 },
  { floor: 6, label: '602', x: 164, y: 24, width: 54, height: 58 },
  { floor: 6, label: '603', x: 230, y: 24, width: 54, height: 58 },
  { floor: 6, label: '604', x: 412, y: 24, width: 55, height: 58 },
  { floor: 6, label: '605', x: 479, y: 24, width: 56, height: 58 },
  { floor: 6, label: '606', x: 547, y: 24, width: 55, height: 58 },
  { floor: 6, label: '607', x: 614, y: 24, width: 55, height: 58 },
  { floor: 6, label: '612', x: 28, y: 132, width: 88, height: 58 },
  { floor: 6, label: '611', x: 128, y: 132, width: 80, height: 58 },
  { floor: 6, label: '609', x: 497, y: 132, width: 80, height: 58 },
  { floor: 6, label: '608', x: 589, y: 132, width: 80, height: 58 },
  // 1 этаж
  { floor: 1, label: '101', x: 98, y: 24, width: 54, height: 58 },
  { floor: 1, label: '102', x: 164, y: 24, width: 54, height: 58 },
  { floor: 1, label: '103', x: 230, y: 24, width: 54, height: 58 },
  { floor: 1, label: '104', x: 412, y: 24, width: 54, height: 58 },
  { floor: 1, label: '105', x: 478, y: 24, width: 54, height: 58 },
  { floor: 1, label: '110', x: 32, y: 132, width: 54, height: 58 },
  { floor: 1, label: '109', x: 98, y: 132, width: 54, height: 58 },
  { floor: 1, label: '108', x: 164, y: 132, width: 54, height: 58 },
  { floor: 1, label: '107', x: 230, y: 132, width: 54, height: 58 },
];

export const MAP_WIDTH = 723;
export const MAP_HEIGHT = 690;
export const FLOOR_MAP_LEFT = 26;
export const FLOOR_MAP_WIDTH = 697;
export const FLOOR_HEIGHT = 214;
