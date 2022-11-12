<template>
  <div class="max-w-md ml-auto mr-auto">
    <main class="flex justify-center space-x-4">
      <section>
        <TetrisWindow :render-data="mainRenderData" />
      </section>
      <aside>
        <TetrisWindow :render-data="nextRenderData" />
      </aside>
    </main>
    <footer class="flex mt-4 p-1 space-x-4">
      <section class="flex flex-grow flex-col justify-center space-y-4">
        <div class="w-full text-center">
          <button
            class="bg-green-200 hover:bg-green-400 rounded-md shadow-md w-28 h-10"
            @click="onChange"
          >
            变化
          </button>
        </div>
        <div class="w-full flex justify-around space-x-4">
          <button
            class="bg-orange-200 hover:bg-orange-400 rounded-md shadow-md w-28 h-10"
            @click="toLeft"
          >
            ←
          </button>
          <button
            class="bg-orange-200 hover:bg-orange-400 rounded-md shadow-md w-28 h-10"
            @click="toRight"
          >
            →
          </button>
        </div>
        <div class="w-full text-center">
          <button
            class="bg-orange-200 hover:bg-orange-400 rounded-md shadow-md w-28 h-10"
            @click="toBottom"
          >
            ↓
          </button>
        </div>
      </section>
      <aside class="flex flex-col justify-around">
        <button
          class="w-28 h-10 bg-blue-200 hover:bg-blue-400 rounded-full shadow-md"
          @click="startGame"
        >
          开始
        </button>
        <button
          class="w-28 h-10 bg-red-200 hover:bg-red-400 rounded-full shadow-md"
          @click="pauseGame"
        >
          暂停
        </button>
      </aside>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ColorBase, MoveType, GraphicType } from "@/types/tetris.enum";
import type { TetrisBlockOp } from "@/types/tetris.interface";
import type { PointPosition } from "@/types/tetris.type";
import { getGraphics } from "@/utils/tetris";
import { computed, reactive, ref, type ComputedRef } from "vue";
import TetrisWindow from "../components/TetrisWindow.vue";

/** 当前图形类型 */
let actGraphicType: GraphicType;
/** 下一个图形类型 */
let nextGraphicType: GraphicType;
/** 当前图形 */
let actGraphic: TetrisBlockOp[] = reactive([]);
/** 下一个图形 */
let nextGraphic: TetrisBlockOp[] = reactive([]);
/** 已经锁定的区域 */
let lockedData: TetrisBlockOp[] = reactive([]);
/** 主界面高度 */
let mainRowCount = ref(20);
/** 主界面宽度 */
let mainColCount = ref(10);

/** 主界面渲染数据 */
let mainRenderData: ComputedRef<TetrisBlockOp[][]> = computed(() => {
  let rowCount = mainRowCount.value;
  let colCount = mainColCount.value;
  let res: TetrisBlockOp[][] = [];
  for (let i = 0; i < rowCount; i++) {
    let row: TetrisBlockOp[] = [];
    for (let j = 0; j < colCount; j++) {
      let cell: TetrisBlockOp = {
        row: i,
        col: j,
        lock: false,
      };
      let isRendered = lockedData.some(
        ({ row, col }) => row === i && col === j
      );
      let isAct = actGraphic.some(({ row, col }) => row === i && col === j);
      if (isRendered) {
        cell.color = ColorBase.Locked;
        cell.lock = true;
      } else if (isAct) {
        cell.color = ColorBase.Brand;
      }
      row.push(cell);
    }
    res.push(row);
  }
  return res;
});

/** 次界面渲染数据 */
let nextRenderData: ComputedRef<TetrisBlockOp[][]> = computed(() => {
  let rowCount = 4;
  let colCount = 4;
  let res: TetrisBlockOp[][] = [];
  for (let i = 0; i < rowCount; i++) {
    let row: TetrisBlockOp[] = [];
    for (let j = 0; j < colCount; j++) {
      let cell: TetrisBlockOp = {
        row: i,
        col: j,
        lock: false,
      };
      let isAct = nextGraphic.some(({ row, col }) => row === i && col === j);
      if (isAct) {
        cell.color = ColorBase.Brand;
      }
      row.push(cell);
    }
    res.push(row);
  }
  return res;
});

/** 所有的图形类型 */
let allTypes = Object.values(GraphicType);

const startGame = () => {
  getActGraphic();
  getNextGraphic();
};

const pauseGame = () => {
  lockedData.push(...actGraphic);
};
/**
 * 获取当前的图形
 */
const getActGraphic = () => {
  let origin: PointPosition = [15, actGraphicType === GraphicType.Hero ? 3 : 4];
  let actType = allTypes[Math.floor(Math.random() * allTypes.length)];
  if (nextGraphicType) {
    actType = nextGraphicType;
  }
  actGraphicType = actType;
  let pointList = getGraphics(actType, origin);
  actGraphic.length = 0;
  actGraphic.push(...pointList);
};

/**
 * 获取下一个图形
 */
const getNextGraphic = () => {
  nextGraphicType = allTypes[Math.floor(Math.random() * allTypes.length)];
  let pointList = getGraphics(nextGraphicType, [0, 0]);
  nextGraphic.length = 0;
  nextGraphic.push(...pointList);
};

const onChange = () => {
  let canChange = actGraphic.every(({ col }) => col > 0);
  if (canChange) {
    console.log(mainRenderData, actGraphic);
  }
};

/**
 * 检查图形位置是否正确
 * @param graphic: 待检查的图形
 */
const checkGraphic = (graphic: TetrisBlockOp[]) => {
  let canMove = graphic.every(({ row, col }) => {
    let inWindow =
      row >= 0 &&
      row < mainRowCount.value &&
      col >= 0 &&
      col < mainColCount.value;
    let isOverlap = lockedData.some(
      (item) => item.row === row && item.col === col
    );
    return inWindow && !isOverlap;
  });
  return canMove;
};

/**
 * 移动图形
 * @param moveType: 移动方向
 */
const moveIt = (moveType: MoveType) => {
  let newGraphic = actGraphic.map((item) => {
    let res = JSON.parse(JSON.stringify(item));
    if (moveType === MoveType.left) {
      res.col--;
    } else if (moveType === MoveType.right) {
      res.col++;
    } else if (moveType === MoveType.bottom) {
      res.row++;
    }
    return res;
  });
  let canMove = checkGraphic(newGraphic);
  if (canMove) {
    actGraphic.length = 0;
    actGraphic.push(...newGraphic);
  }
};

/**
 * 向左移动
 */
const toLeft = () => {
  moveIt(MoveType.left);
};

/**
 * 向右移动
 */
const toRight = () => {
  moveIt(MoveType.right);
};

/**
 * 向下移动
 */
const toBottom = () => {
  moveIt(MoveType.bottom);
};
</script>
