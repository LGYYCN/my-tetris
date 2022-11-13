import type { ColorBase } from "./tetris.enum";

export interface TetrisBlockOp {
  row: number;
  col: number;
  color?: `${ColorBase}`;
  lock?: boolean;
  beDel?: boolean;
}
