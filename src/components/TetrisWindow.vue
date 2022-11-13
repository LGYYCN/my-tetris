<template>
  <main class="border shadow-md p-0.5 rounded-sm">
    <div class="tetris_row flex" v-for="(row, i) in props.renderData" :key="i">
      <div class="tetris_col" v-for="(col, j) in row" :key="j">
        <div
          class="tetris_block w-6 h-6 m-0.5"
          :class="col.beDel ? 'animate-pulse' : ''"
          :style="{ backgroundColor: col.color || baseColor }"
        ></div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ColorBase } from "@/types/tetris.enum";
import type { TetrisBlockOp } from "@/types/tetris.interface";

const baseColor = ColorBase.Fill;
const props = defineProps<{
  renderData: TetrisBlockOp[][];
}>();
</script>

<style scoped></style>
LockedLocked
