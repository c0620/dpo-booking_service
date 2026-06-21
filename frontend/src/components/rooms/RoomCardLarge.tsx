import type { Room } from "../../api/types";
import { RoomAmenityTags } from "./RoomAmenityTags";
import { RoomTag } from "./RoomTag";

interface Props {
  room: Room;
  actionLabel: string;
  onAction: () => void;
  extraInfo?: string;
  compact?: boolean;
}

export function RoomCardLarge({
  room,
  actionLabel,
  onAction,
  extraInfo,
  compact,
}: Props) {
  const image = room.imageUrls[0] ?? "/assets/rooms/room-106.jpg";

  return (
    <div
      className={`room-card-large${compact ? " room-card-large--compact" : ""}`}
    >
      <div className="room-image-wrap">
        <img src={image} alt={room.name} />
      </div>
      <div className="room-info">
        <div className="room-info-body">
          <h3 className="room-card-title h2">{room.name}</h3>
          <div className="d-flex gap-2 mb-2 flex-wrap">
            <RoomTag icon="location">
              {room.code}, {room.floor} этаж
            </RoomTag>
            {room.capacity > 0 && (
              <RoomTag icon="capacity">{room.capacity} мест</RoomTag>
            )}
          </div>
          <p className="room-card-desc t1">{room.description}</p>
          {extraInfo && (
            <p className="room-card-desc room-card-desc--extra t1">
              {extraInfo}
            </p>
          )}
          <RoomAmenityTags amenities={room.amenities} />
        </div>
        {actionLabel && (
          <button
            type="button"
            className="btn-primary-custom room-card-action b2"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
