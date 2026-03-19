<script setup lang="ts">
type FuluMode = 'none' | 'chi' | 'pon' | 'kan'

interface Props {
  mode: FuluMode
  canFulu: boolean
  chiCount: number
  ponCount: number
  kanCount: number
}

interface Emits {
  (e: 'enter-chi'): void
  (e: 'enter-pon'): void
  (e: 'enter-kan'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="fulu-buttons">
    <template v-if="mode === 'none'">
      <el-button
        size="small"
        :disabled="!canFulu || chiCount === 0"
        @click="() => emit('enter-chi')"
      >
        吃
      </el-button>
      <el-button
        size="small"
        :disabled="!canFulu || ponCount === 0"
        @click="() => emit('enter-pon')"
      >
        碰
      </el-button>
      <el-button
        size="small"
        :disabled="!canFulu || kanCount === 0"
        @click="() => emit('enter-kan')"
      >
        杠
      </el-button>
    </template>
    <el-button v-else size="small" @click="() => emit('cancel')">取消</el-button>
  </div>
</template>

<style scoped>
.fulu-buttons {
  display: flex;
  gap: 8px;
}
</style>
