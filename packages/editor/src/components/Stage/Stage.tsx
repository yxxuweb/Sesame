import { IStage } from "../type"
import './stage.css'

export const Stage = (
  { width, height, children }: IStage
) => {



  return (
    <svg

      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      style={{ width, height }}
      className="stage-container">
      {children}
    </svg>
  )
}
