import type { ReactNode } from "react";

interface Props {
  icon: "location" | "capacity";
  children: ReactNode;
}

export function RoomTag({ icon, children }: Props) {
  const src =
    icon === "location"
      ? "/assets/icons/icon-location.svg"
      : "/assets/icons/icon-capacity.svg";
  return (
    <span className="tag b3">
      <img src={src} alt="" />
      {children}
    </span>
  );
}
