<script setup lang="ts">
interface Props {
  chiEnabled: boolean
  ponEnabled: boolean
  kanEnabled: boolean
}

interface Emits {
  (e: 'toggle-chi'): void
  (e: 'toggle-pon'): void
  (e: 'toggle-kan'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="fulu-buttons">
    <el-button
      size="small"
      :type="chiEnabled ? 'primary' : 'info'"
      @click="() => emit('toggle-chi')"
    >
      吃
    </el-button>
    <el-button
      size="small"
      :type="ponEnabled ? 'success' : 'info'"
      @click="() => emit('toggle-pon')"
    >
      碰
    </el-button>
    <el-button
      size="small"
      :type="kanEnabled ? 'warning' : 'info'"
      @click="() => emit('toggle-kan')"
    >
      杠
    </el-button>
  </div>
</template>

<style scoped>
.fulu-buttons {
  display: flex;
  gap: 8px;
}
</style>
