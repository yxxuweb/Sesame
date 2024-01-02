import { ReactNode } from "react";
import { ISprite } from "../type";

export const GSprite = ({ sprite, children }: { sprite: ISprite, children?: ReactNode }) => {
  const { id, attrs } = sprite;
  const { size, coordinate, angle = 0 } = attrs;
  const { width, height } = size;
  const { x, y } = coordinate;

  const rotate = angle ? `rotate(${angle}, ${x + width / 2} ${y + height / 2})` : '';
  const transform = `${rotate} translate(${x}, ${y})`;

  return (
    <g className="sprite-container" data-sprite-id={id} transform={transform}>
      {children}
    </g>
  );
}
