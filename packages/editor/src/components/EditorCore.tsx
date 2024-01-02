import {
  useState,
  forwardRef,
  useImperativeHandle
} from 'react';
import { Stage } from './Stage/Stage'
import { GSprite } from './Sprites/GSprite'
import LineSpriteMeta from './Sprites/Line/Line'
import RectSpriteMeta from './Sprites/Rect/Rect'
import { ISprite, ISpriteAttrs, ISpriteMeta } from './type';
import Grid from './Grid/Grid';

interface IProps {
  width: number | string,
  height: number | string,
  onReady?: () => void;
}

export const EditorCore = forwardRef(function (props: IProps, ref) {
  const [registerSpriteMetaMap, setRegisterSpriteMetaMap] = useState<Record<string, ISpriteMeta>>({
    'LineSprite': LineSpriteMeta,
    'RectSprite': RectSpriteMeta
  });
  const [sprites, setSprites] = useState<ISprite[]>([
    {
      id: 'LineSpriteMeta1',
      type: 'LineSprite',
      props: {
        stroke: "#84db92",
        strokeWidth: 3,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0
      },
      attrs: {
        coordinate: { x: 100, y: 100 },
        size: { width: 160, height: 160 },
        angle: 0
      }
    },
    {
      id: "RectSprite1",
      type: "RectSprite",
      props: {
        fill: "#fdc5bf",
      },
      attrs: {
        coordinate: { x: 200, y: 200 },
        size: { width: 160, height: 100 },
        angle: 0
      }
    }
  ]);

  const gridSize = 10;

  const [grid, setGrid] = useState({
    x: 0,
    y: 0,
    width: gridSize,
    height: gridSize,
  });

  /**
   * 注册精灵
   * @param spriteMeta 组件对象
   * @returns null
   */
  function registerSprite(spriteMeta: ISpriteMeta) {
    if (registerSpriteMetaMap[spriteMeta.type]) {
      console.error(`sprite ${spriteMeta.type} is already registered`);
      return
    }
    setRegisterSpriteMetaMap({ ...registerSpriteMetaMap, [spriteMeta.type]: spriteMeta });
  }

  /**
   * 添加精灵到画布
   * @param sprite
   */
  function addSpriteToStage(sprite: ISprite | ISprite[]) {
    setSprites((prev) => {
      return [...prev, ...(Array.isArray(sprite) ? sprite : [sprite])]
    })
  }

  function updateSprites(sprites: ISprite[], addToHistory = false) {

  }

  function updateSpriteAttrs(sprite: ISprite, attrs: ISpriteAttrs, addToHistory = false) {

  }

  useImperativeHandle(ref, () => {
    return {
      registerSprite,
      addSpriteToStage,
      updateSprites
    }
  })

  return (
    <Stage onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseOut={handleMouseUp}
      onWheel={handleWheel} width={'100%'} height={'100%'}>
      <Grid />
      <g style={{ transform: 'matrix(1, 0, 0, 1, 50, 0)' }}>
        {
          sprites.map((sprite) => {
            const spriteMeta = registerSpriteMetaMap[sprite.type];
            const SpriteComponent =
              (spriteMeta?.spriteComponent as any) ||
              (() => <text fill="red">Undefined Sprite: {sprite.type}</text>);

            return (
              <GSprite key={sprite.id} sprite={sprite}>
                <SpriteComponent sprite={sprite} />
              </GSprite>
            )
          })
        }
      </g>
    </Stage>
  )
})
