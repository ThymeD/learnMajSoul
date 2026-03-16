<script setup lang="ts">
import huVideo from '../../assets/images/hu.mp4'
import { ref } from 'vue'

const showVideo = ref(false)

const playVideo = () => {
  showVideo.value = true
  setTimeout(() => {
    showVideo.value = false
  }, 2000)
}
</script>

<template>
  <div class="page">
    <h2>视频透明测试</h2>
    <p>点击按钮测试视频效果</p>
    <el-button type="primary" @click="playVideo">播放胡牌动画</el-button>

    <div class="test-card">
      <h3>测试卡片 - 被视频覆盖的区域</h3>
      <p>这是卡片内容，会被视频覆盖</p>
      <div class="tiles"><span>🀇</span><span>🀈</span><span>🀉</span></div>
    </div>

    <!-- 测试1: 固定定位全屏 -->
    <div v-if="showVideo" class="video-overlay-1">
      <video :src="huVideo" autoplay muted playsinline class="test-video" />
    </div>

    <!-- 测试2: mix-blend-mode -->
    <div v-if="showVideo" class="video-overlay-2">
      <video :src="huVideo" autoplay muted playsinline class="test-video blend" />
    </div>

    <!-- 测试3: 背景透明 -->
    <div v-if="showVideo" class="video-overlay-3">
      <video :src="huVideo" autoplay muted playsinline class="test-video" />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  background: linear-gradient(180deg, #f0f2f5 0%, #e8eaed 100%);
  min-height: 100vh;
}

.test-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
}

.tiles span {
  font-size: 40px;
  margin-right: 8px;
}

/* 测试1: 固定定位 */
.video-overlay-1 {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-video {
  width: 60%;
  height: auto;
}

/* 测试2: 混合模式 */
.video-overlay-2 {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9998;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.blend {
  mix-blend-mode: multiply;
}

/* 测试3: 透明背景 */
.video-overlay-3 {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9997;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
