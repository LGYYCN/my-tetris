import { ColorBase, GraphicType, RotationType } from "@/types/tetris.enum";
import type { TetrisBlockOp } from "@/types/tetris.interface";
import type { PointPosition, PointMap } from "@/types/tetris.type";

export const getGraphicsPointMap = (
  type: GraphicType,
  rotation: RotationType
): PointMap => {
  type IPointMap = {
    [k in GraphicType]: PointMap;
  };
  const pointMap: IPointMap = {
    [GraphicType.OrangeRicky]: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    [GraphicType.BlueRicky]: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    [GraphicType.ClevelandZ]: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [GraphicType.RhodeIslandZ]: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [GraphicType.Hero]: [[1, 1, 1, 1]],
    [GraphicType.Teewee]: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    [GraphicType.Smashboy]: [
      [1, 1],
      [1, 1],
    ],
  };
  let actPointInfo = pointMap[type];
  while (rotation > RotationType.ToTop) {
    actPointInfo = rotationIt(actPointInfo);
    rotation--;
  }
  return actPointInfo;
};

const rotationIt = (pointList: PointMap) => {
  const res: PointMap = [];
  for (let i = 0; i < pointList[0].length; i++) {
    res[i] = [];
    for (let j = 0; j < pointList.length; j++) {
      res[i][j] = pointList[pointList.length - 1 - j][i];
    }
  }
  return res;
};

/**
 * 获取图形的点位信息
 * @param type: 图形类型
 * @returns
 */
const getGraphicsPointList = (
  type: GraphicType,
  origin: PointPosition = [0, 0],
  rotation: RotationType = RotationType.ToTop
) => {
  const pointList: PointPosition[] = [];
  const pointInfo: PointMap = getGraphicsPointMap(type, rotation);

  pointInfo.forEach((row, i) => {
    row.forEach((state, j) => {
      if (state) {
        pointList.push([i + origin[0], j + origin[1]]);
      }
    });
  });
  return pointList;
};

/**
 * 获取图形的样式等列表
 * @param pointMap: 图形的点位列表
 * @returns
 */
const getGraphicsBlockList = (
  pointMap: PointPosition[],
  color: ColorBase = ColorBase.Brand,
  lock: boolean = false
): TetrisBlockOp[] => {
  return pointMap.map(([row, col]) => {
    return {
      row,
      col,
      color,
      lock,
    };
  });
};

/**
 * 获取图形
 * @param type: 图形类型
 * @returns
 */
export const getGraphics = (
  type: GraphicType,
  origin: PointPosition = [0, 0],
  rotation: RotationType = RotationType.ToTop
) => {
  const res: TetrisBlockOp[] = [];
  let pointMap: PointPosition[] = [];
  let blockList: TetrisBlockOp[] = [];
  pointMap = getGraphicsPointList(type, origin, rotation);
  blockList = getGraphicsBlockList(pointMap);
  res.push(...blockList);
  return res;
};
