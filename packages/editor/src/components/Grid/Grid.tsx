import { IGrid } from "../type";



export default (props: IGrid) => {
  const { grid } = props
  return (
    <>
      <defs>
        <pattern
          id="pattern_0"
          patternUnits="userSpaceOnUse"
          x={grid.x}
          y={grid.y}
          width={grid.width}
          height={grid.height}
        >
          <path
            d={`M ${grid.width} 0 H0 M0 0 V0 ${grid.height}`}
            stroke="rgba(224,224,224,1)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pattern_0)" />
    </>
  )
}
