import type { Room } from "../../api/types";
import { RoomTag } from "./RoomTag";

interface Props {
  room: Room;
  onDetails: () => void;
}

export function RoomCardSmall({ room, onDetails }: Props) {
  const image = room.imageUrls[0] ?? "/assets/rooms/room-small.jpg";

  return (
    <div className="room-card-small">
      <div className="thumb">
        <img src={image} alt={room.name} />
      </div>
      <div className="body">
        <div
          className="room-card-title h2"
          style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
        >
          {room.name}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <RoomTag icon="location">
            {room.code}, {room.floor} этаж
          </RoomTag>
          {room.capacity > 0 && (
            <RoomTag icon="capacity">{room.capacity} мест</RoomTag>
          )}
        </div>
        <button
          type="button"
          className="btn-primary-custom b2"
          onClick={onDetails}
        >
          Подробнее
        </button>
      </div>
    </div>
  );
}
