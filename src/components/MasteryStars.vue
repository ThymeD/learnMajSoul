<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const count = ref(props.modelValue ?? 0)

watch(() => props.modelValue, (val) => {
  count.value = val ?? 0
})

const getCount = () => count.value
const setCount = (val: number) => {
  count.value = val
  emit('update:modelValue', val)
}

defineExpose({ getCount, setCount })
</script>

<template>
  <div class="mastery-count">
    <span class="count">{{ count }}</span>
  </div>
</template>

<style scoped>
.mastery-count {
  display: flex;
  align-items: center;
}

.count {
  font-size: 24px;
  font-weight: 700;
  color: #e6b800;
  min-width: 32px;
  text-align: center;
}
</style>
