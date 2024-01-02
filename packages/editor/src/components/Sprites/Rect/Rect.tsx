import { IDefaultGraphicProps, ISpriteMeta } from "../../type";
import { BaseSprite } from "../BaseSprite";


type IProps = IDefaultGraphicProps

// 矩形精灵
export const Rect = (props: IProps) => {
  return (
    <rect
      x="0"
      y="0"
      fill="#f2e7ff"
      stroke="#a245ff"
      strokeWidth="3"
      {...props}
    />
  );
};

// 矩形精灵组件
export class RectSprite extends BaseSprite<IProps> {
  render() {
    const { sprite } = this.props;
    const { props, attrs } = sprite;
    const { width, height } = attrs.size;
    return (
      <>
        <Rect {...props} x={0} y={0} width={width} height={height} />
      </>
    );
  }
}

const SpriteType = 'RectSprite'

// 描述精灵的元数据
export const RectSpriteMeta: ISpriteMeta<IProps> = {
  // 类型，精灵的名字，全局唯一
  type: SpriteType,
  // 精灵组件
  spriteComponent: RectSprite
};

export default RectSpriteMeta;
