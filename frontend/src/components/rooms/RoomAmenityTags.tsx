interface Props {
  amenities: string[];
}

export function RoomAmenityTags({ amenities }: Props) {
  return (
    <div>
      {amenities.map((a) => (
        <span key={a} className="amenity-tag t2">
          {a}
        </span>
      ))}
    </div>
  );
}
