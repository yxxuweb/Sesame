// 精灵
import { ILine, IDefaultGraphicProps, ISprite } from '../../type';
import { BaseSprite } from '../BaseSprite';
type IProps = ILine & IDefaultGraphicProps

export const Line = (props: IProps) => {


  return (
    <line
      stroke="#ffa245"
      strokeWidth="2"
      {...props} />
  );
};

export class LineSprite extends BaseSprite<IProps> {
  render() {
    const { sprite } = this.props;
    const { props, attrs } = sprite;
    return (
      <>
        <Line {...props} strokeWidth={6} stroke='transparent' />
        <Line {...props} />
      </>
    );
  }
}

const SpriteType = 'LineSprite';

export const LineSpriteMeta = {
  type: SpriteType,
  spriteComponent: LineSprite,
}

export default LineSpriteMeta;
