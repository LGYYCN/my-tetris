<template>
  <div class="max-w-md ml-auto mr-auto">
    <main class="flex justify-center space-x-4">
      <section>
        <TetrisWindow :render-data="mainRenderData" />
      </section>
      <aside>
        <TetrisWindow :render-data="nextRenderData" />
        <p class="mt-4">
          难度:
          <!-- <button class="w-5 h-5 border" @click="gameLevel--">-</button> -->
          {{ gameLevel }}
          <!-- <button class="w-5 h-5 border" @click="gameLevel++">+</button> -->
        </p>
        <p class="mt-4">消除的行数: {{ deleteRows }}</p>
        <p class="mt-4">得分: {{ gameScore }}</p>
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
            @click="toBottom(false)"
            @dblclick="toBottom(true)"
          >
            ↓
          </button>
        </div>
      </section>
      <aside class="flex flex-col justify-around">
        <button
          v-if="gameState === 'reset'"
          class="w-28 h-10 bg-blue-200 hover:bg-blue-400 rounded-full shadow-md"
          @click="playGame"
        >
          Play
        </button>
        <button
          v-else
          class="w-28 h-10 bg-blue-200 hover:bg-blue-400 rounded-full shadow-md"
          @click="resetGame"
        >
          Reset
        </button>
        <button
          v-show="gameState !== 'reset'"
          class="w-28 h-10 bg-red-200 hover:bg-red-400 rounded-full shadow-md"
          @click="pauseGame"
        >
          {{ gameState === "play" ? "暂停" : "继续" }}
        </button>
      </aside>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  ColorBase,
  MoveType,
  GraphicType,
  GameState,
  RotationType,
} from "@/types/tetris.enum";
import type { TetrisBlockOp } from "@/types/tetris.interface";
import type { PointPosition } from "@/types/tetris.type";
import { getGraphics } from "@/utils/tetris";
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";
import TetrisWindow from "../components/TetrisWindow.vue";

/** 当前图形类型 */
let actGraphicType: GraphicType | null;
/** 当前图形的方向 */
let actGraphicRotation: RotationType;
/** 下一个图形类型 */
let nextGraphicType: GraphicType | null;
/** 当前图形 */
let actGraphic: TetrisBlockOp[] = reactive([]);
/** 下一个图形 */
let nextGraphic: TetrisBlockOp[] = reactive([]);
/** 已经锁定的区域 */
let lockedData: TetrisBlockOp[][] = reactive([]);
/** 主界面高度 */
let mainRowCount = ref(20);
/** 主界面宽度 */
let mainColCount = ref(10);
/** 游戏计时器 */
let gameTimer = 0;
/** 游戏难度 */
let gameLevel = ref(1);
/** 消除的行数 */
let deleteRows = ref(0);
/** 游戏得分 */
let gameScore = ref(0);
/** 游戏状态 */
let gameState: Ref<GameState> = ref(GameState.Reset);

/** 游戏速度 */
let gameSpeed: ComputedRef<number> = computed(
  () => (11 - gameLevel.value) * 100
);

/** 主界面渲染数据 */
let mainRenderData: ComputedRef<TetrisBlockOp[][]> = computed(() => {
  let res: TetrisBlockOp[][] = JSON.parse(JSON.stringify(lockedData));
  actGraphic.forEach((item) => {
    res[item.row][item.col] = { ...item };
  });
  return res;
});

watch(lockedData, (newData, oldData) => {
  console.log("lockedData changed", { newData, oldData });
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

const initMainData = () => {
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
      row.push(cell);
    }
    res.push(row);
  }
  return res;
};

onMounted(() => {
  lockedData.length = 0;
  lockedData.push(...initMainData());
  document.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
});

const onKeyDown = (event: KeyboardEvent) => {
  switch (event.code) {
    case "ArrowUp":
      onChange();
      break;
    case "ArrowDown":
      toBottom();
      break;
    case "ArrowLeft":
      toLeft();
      break;
    case "ArrowRight":
      toRight();
      break;

    case "Enter":
    case "NumberEnter":
      if (gameState.value !== GameState.Reset) {
        resetGame();
      } else {
        playGame();
      }
      break;

    case "Space":
      pauseGame();
      break;

    default:
      break;
  }
};

const playGame = () => {
  gameState.value = GameState.Play;
  getActGraphic();
  if (checkIt(getNewGraphic(actGraphic, MoveType.Bottom))) {
    getNextGraphic();
    startGame();
  } else {
    alert("End");
  }
};

const resetGame = () => {
  clearInterval(gameTimer);
  gameState.value = GameState.Reset;
  gameLevel.value = 1;
  gameScore.value = 0;
  actGraphic.length = 0;
  nextGraphic.length = 0;
  actGraphicType = null;
  nextGraphicType = null;
  lockedData.length = 0;
  lockedData.push(...initMainData());
};

watch(gameLevel, () => {
  if (gameState.value === GameState.Play) {
    startGame();
  }
});

const getScore = () => {
  let actDelRows: number[] = [];
  lockedData.forEach((row, i) => {
    let beDel = row.every((col) => col.lock);
    if (beDel) {
      actDelRows.push(i);
      row.forEach((col) => (col.beDel = true));
    }
  });
  if (actDelRows.length) {
    gameScore.value += (1 + actDelRows.length) * actDelRows.length * 5;
    let newLockData = lockedData.filter((row, i) => !actDelRows.includes(i));
    let addData: TetrisBlockOp[][] = [];
    addData.length = mainRowCount.value - newLockData.length;
    addData.fill([]);
    addData.forEach((row) => {
      row.length = mainColCount.value;
      row.fill({
        row: 0,
        col: 0,
      });
    });
    newLockData.unshift(...addData);
    lockedData.length = 0;
    lockedData.push(...newLockData);
  }
  deleteRows.value += actDelRows.length;
};

const startGame = () => {
  if (gameTimer) {
    clearInterval(gameTimer);
  }
  gameTimer = setInterval(() => {
    let canMove = checkIt(getNewGraphic(actGraphic, MoveType.Bottom));
    if (canMove) {
      moveIt(actGraphic, MoveType.Bottom);
    } else {
      clearInterval(gameTimer);
      actGraphic.forEach((item) => {
        item.lock = true;
        item.color = ColorBase.Locked;
        lockedData[item.row][item.col] = item;
      });
      getScore();
      setTimeout(() => {
        playGame();
      }, 500);
    }
  }, gameSpeed.value);
};

const pauseGame = () => {
  if (gameState.value === GameState.Pause) {
    gameState.value = GameState.Play;
    startGame();
  } else if (gameState.value === GameState.Play) {
    clearInterval(gameTimer);
    gameState.value = GameState.Pause;
  }
};
/**
 * 获取当前的图形
 */
const getActGraphic = () => {
  let origin: PointPosition = [0, actGraphicType === GraphicType.Hero ? 3 : 4];
  let actType = allTypes[Math.floor(Math.random() * allTypes.length)];
  if (nextGraphicType) {
    actType = nextGraphicType;
  }
  actGraphicType = actType;
  actGraphicRotation = RotationType.ToTop;
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
  if (gameState.value === GameState.Play) {
    let rotationType = actGraphicRotation;
    if (actGraphicRotation === Object.keys(RotationType).length - 1) {
      rotationType = -1;
    }

    let newGraphic = getRotationGraphic(actGraphic, ++rotationType);
    if (checkIt(newGraphic)) {
      actGraphicRotation = rotationType;
      actGraphic.length = 0;
      actGraphic.push(...newGraphic);
    }
  }
};

const getRotationGraphic = (
  graphic: TetrisBlockOp[],
  rotationType: RotationType
): TetrisBlockOp[] => {
  let minRow = Math.min(...graphic.map(({ row }) => row));
  let minCol = Math.min(...graphic.map(({ col }) => col));
  let g = getGraphics(
    actGraphicType as GraphicType,
    [minRow, minCol],
    rotationType
  );
  return g;
};

/**
 * 根据图形及其移动方向获取新图形
 * @param graphic: 旧图形
 * @param moveType: 移动方向
 */
const getNewGraphic = (
  graphic: TetrisBlockOp[],
  moveType: MoveType
): TetrisBlockOp[] => {
  let newGraphic: TetrisBlockOp[] = [];
  newGraphic = graphic.map((item) => {
    let res = JSON.parse(JSON.stringify(item));
    switch (moveType) {
      case MoveType.Left:
        res.col--;
        break;
      case MoveType.Right:
        res.col++;
        break;
      case MoveType.Bottom:
        res.row++;
        break;

      default:
        break;
    }
    return res;
  });
  return newGraphic;
};

/**
 * 移动图形
 * @param moveType: 移动方向
 */
const moveIt = (graphic: TetrisBlockOp[], moveType: MoveType) => {
  let newGraphic = getNewGraphic(graphic, moveType);
  let canMove = checkIt(newGraphic);
  if (canMove) {
    actGraphic.length = 0;
    actGraphic.push(...newGraphic);
  }
};

/**
 * 检查图形位置是否正确
 * @param graphic: 待检查的图形
 */
const checkIt = (graphic: TetrisBlockOp[]): boolean => {
  let isValid = graphic.every(({ row, col }) => {
    let inWindow =
      row >= 0 &&
      row < mainRowCount.value &&
      col >= 0 &&
      col < mainColCount.value;
    let isOverlap = lockedData.some((item, i) => {
      return item.some((c, j) => i === row && j === col && c.lock);
    });
    return inWindow && !isOverlap;
  });
  return isValid;
};

/**
 * 向左移动
 */
const toLeft = () => {
  if (gameState.value === GameState.Play) {
    moveIt(actGraphic, MoveType.Left);
  }
};

/**
 * 向右移动
 */
const toRight = () => {
  if (gameState.value === GameState.Play) {
    moveIt(actGraphic, MoveType.Right);
  }
};

/**
 * 向下移动
 */
const toBottom = (isDroop = false) => {
  if (gameState.value === GameState.Play) {
    if (isDroop) {
      let canMove = true;
      while (canMove) {
        let newGraphic = getNewGraphic(actGraphic, MoveType.Bottom);
        canMove = checkIt(newGraphic);
        if (canMove) {
          actGraphic.length = 0;
          actGraphic.push(...newGraphic);
        }
      }
    } else {
      moveIt(actGraphic, MoveType.Bottom);
    }
  }
};
</script>
