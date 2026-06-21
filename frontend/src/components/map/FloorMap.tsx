import { useState } from "react";
import type { Room } from "../../api/types";
import {
  FLOOR_HEIGHT,
  FLOOR_MAP_LEFT,
  FLOOR_MAP_WIDTH,
  FLOOR_OFFSETS,
  GRAY_ROOMS,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "./mapLayout";

export type AssetProps = {
  type: "toilet" | "stairs" | "checkpoint" | "elevator";
  x: number;
  y: number;
  floor: 8 | 6 | 1;
};

const ASSET_ICONS: Record<
  AssetProps["type"],
  { src: string; width: number; height: number }
> = {
  toilet: { src: "/assets/icons/icon-toilet.svg", width: 20, height: 21 },
  stairs: { src: "/assets/icons/icon-stairs.svg", width: 28, height: 21 },
  elevator: { src: "/assets/icons/icon-elevator.svg", width: 18, height: 26 },
  checkpoint: {
    src: "/assets/icons/icon-checkpoint.svg",
    width: 23,
    height: 20,
  },
};

interface Props {
  rooms: Room[];
  selectedRoomId?: number;
  hoveredRoomId?: number;
  onRoomSelect: (room: Room) => void;
  detailMode?: boolean;
  useDetailMap?: boolean;
  assets: AssetProps[];
}

function GrayRoom({
  x,
  y,
  width,
  height,
  label,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        fill="#ededed"
        stroke="#c2c2c2"
        strokeWidth={2}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fill="#c2c2c2"
        fontSize={12}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}

function MapAsset({ type, x, y }: Pick<AssetProps, "type" | "x" | "y">) {
  const icon = ASSET_ICONS[type];
  return (
    <image
      href={icon.src}
      x={x}
      y={y}
      width={icon.width}
      height={icon.height}
      aria-hidden
    />
  );
}

function FloorLabel({ floor, y }: { floor: number; y: number }) {
  return (
    <text
      x={14}
      y={y + FLOOR_HEIGHT / 2 + 7}
      fill="#6e6e6e"
      fontSize={20}
      fontWeight={700}
      textAnchor="middle"
    >
      {floor}
    </text>
  );
}

export function FloorMap({
  rooms,
  selectedRoomId,
  hoveredRoomId,
  onRoomSelect,
  detailMode,
  useDetailMap,
  assets,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="floor-map-container">
      <svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="floor-map-svg"
        preserveAspectRatio="xMidYMid meet"
        data-detail={useDetailMap ? "true" : "false"}
      >
        {[8, 6, 1].map((floor) => {
          const floorY = FLOOR_OFFSETS[floor];
          return (
            <g key={floor}>
              <rect
                x={FLOOR_MAP_LEFT}
                y={floorY}
                width={FLOOR_MAP_WIDTH}
                height={FLOOR_HEIGHT}
                fill="#ffffff"
                rx={10}
              />
              <FloorLabel floor={floor} y={floorY} />
              <g transform={`translate(${FLOOR_MAP_LEFT}, ${floorY})`}>
                {GRAY_ROOMS.filter((r) => r.floor === floor).map((r) => (
                  <GrayRoom
                    key={r.label}
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    label={r.label}
                  />
                ))}
              </g>
            </g>
          );
        })}

        {assets.map((a, index) => {
            const floorY = FLOOR_OFFSETS[a.floor] ?? 0;
            const x = FLOOR_MAP_LEFT + a.x;
            const y = floorY + a.y;

            return (
              <MapAsset
                key={`${a.type}-${a.floor}-${a.x}-${a.y}-${index}`}
                x={x}
                y={y}
                type={a.type}
              />
            );
          })}

        {rooms.map((room) => {
          const floorY = FLOOR_OFFSETS[room.floor] ?? 0;
          const isSelected = room.id === selectedRoomId;
          const isHovered = room.id === (hoveredRoomId ?? hovered);
          const x = FLOOR_MAP_LEFT + room.mapX;
          const y = floorY + room.mapY;

          return (
            <g
              key={room.id}
              data-room={room.code}
              style={{ cursor: "pointer" }}
              onClick={() => onRoomSelect(room)}
              onMouseEnter={() => setHovered(room.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={x}
                y={y}
                width={room.mapWidth}
                height={room.mapHeight}
                rx={10}
                fill={
                  isSelected ? "#327afe" : isHovered ? "#5c97ff" : "#327afe"
                }
                opacity={detailMode && !isSelected ? 0.35 : 1}
              />
              <text
                x={x + room.mapWidth / 2}
                y={y + room.mapHeight / 2 + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={12}
                fontWeight={600}
              >
                {room.code}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
