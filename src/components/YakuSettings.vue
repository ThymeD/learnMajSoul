<script setup lang="ts">
import type { Wind } from '../stores/hand'

interface Props {
  isLiqi: boolean
  canLiqi: boolean
  dealer: boolean
  selfWind: Wind
  fieldWind: Wind
  liqiDisabled?: boolean
}

interface Emits {
  (e: 'liqi-change', value: boolean): void
  (e: 'dealer-change', value: boolean): void
  (e: 'self-wind-change', wind: Wind): void
  (e: 'field-wind-change', wind: Wind): void
}

const props = withDefaults(defineProps<Props>(), {
  isLiqi: false,
  canLiqi: false,
  dealer: false,
  selfWind: 'd1',
  fieldWind: 'd1',
  liqiDisabled: false
})

const emit = defineEmits<Emits>()

const windOptions = [
  { value: 'd1', label: '东' },
  { value: 'd2', label: '南' },
  { value: 'd3', label: '西' },
  { value: 'd4', label: '北' }
]

const handleLiqiChange = (val: boolean) => {
  emit('liqi-change', val)
}

const handleDealerChange = (val: boolean) => {
  emit('dealer-change', val)
}

const handleSelfWindChange = (val: Wind) => {
  emit('self-wind-change', val)
}

const handleFieldWindChange = (val: Wind) => {
  emit('field-wind-change', val)
}
</script>

<template>
  <div class="yaku-settings">
    <div class="setting-item">
      <el-checkbox
        :model-value="isLiqi"
        :disabled="!canLiqi || liqiDisabled"
        @change="handleLiqiChange"
      >
        立直
      </el-checkbox>
    </div>
    <div class="setting-item">
      <el-checkbox :model-value="dealer" @change="handleDealerChange"> 庄家 </el-checkbox>
    </div>
    <div class="setting-item">
      <span class="setting-label">自风：</span>
      <el-select
        :model-value="selfWind"
        size="small"
        style="width: 80px"
        @change="handleSelfWindChange"
      >
        <el-option
          v-for="wind in windOptions"
          :key="wind.value"
          :label="wind.label"
          :value="wind.value"
        />
      </el-select>
    </div>
    <div class="setting-item">
      <span class="setting-label">场风：</span>
      <el-select
        :model-value="fieldWind"
        size="small"
        style="width: 80px"
        @change="handleFieldWindChange"
      >
        <el-option
          v-for="wind in windOptions"
          :key="wind.value"
          :label="wind.label"
          :value="wind.value"
        />
      </el-select>
    </div>
  </div>
</template>

<style scoped>
.yaku-settings {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.setting-label {
  color: #606266;
  font-size: 14px;
}
</style>
