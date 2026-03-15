<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const pressing = ref(false)
const incrementing = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const startPress = () => {
  if (timer || incrementing.value) return
  pressing.value = true
  timer = setTimeout(() => {
    count.value++
    pressing.value = false
    incrementing.value = true
    timer = null
    setTimeout(() => {
      incrementing.value = false
    }, 500)
  }, 2000)
}

const endPress = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  pressing.value = false
}
</script>

<template>
  <div class="page">
    <h2>长按 +1 动画测试</h2>
    <p>长按卡片2秒触发+1动画</p>

    <div 
      class="test-card"
      :class="{ pressing: pressing, incrementing: incrementing }"
      @mousedown.prevent="startPress"
      @mouseup="endPress"
      @mouseleave="endPress"
    >
      <div v-if="pressing" class="press-progress"></div>
      <div v-if="incrementing" class="increment-text">+1</div>
      
      <div class="card-content">
        <h3>立直</h3>
        <p>门前清状态听牌即可立直，立直状态下和牌</p>
        <div class="count-display">{{ count }}</div>
      </div>
    </div>

    <div class="tips">
      <p>当前计数: {{ count }}</p>
      <el-button @click="count = 0">重置</el-button>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
}

.test-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  max-width: 400px;
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-content h3 {
  margin: 0 0 8px;
  font-size: 24px;
}

.count-display {
  font-size: 48px;
  font-weight: 700;
  color: #e6b800;
  margin-top: 16px;
}

.press-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  pointer-events: none;
  z-index: 5;
}

.press-progress::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, 
    rgba(64, 158, 255, 0.1) 0%, 
    rgba(64, 158, 255, 0.3) 30%,
    rgba(64, 158, 255, 0.5) 60%, 
    rgba(64, 158, 255, 0.8) 100%
  );
  transform-origin: left;
  animation: chargeWave 2s ease-out forwards;
}

@keyframes chargeWave {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}

.increment-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: 700;
  color: #e6b800;
  z-index: 100;
  animation: incrementAnim 0.5s ease-out forwards;
  pointer-events: none;
}

@keyframes incrementAnim {
  0% {
    opacity: 1;
    transform: translate(-50%, -150%) scale(1.5);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 0%) scale(0.8);
  }
}

.tips {
  margin-top: 24px;
}
</style>
