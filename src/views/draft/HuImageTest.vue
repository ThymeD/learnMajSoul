<script setup lang="ts">
import huImage from '../../assets/images/hu.png'
</script>

<template>
  <div class="page">
    <h2>插图透明测试</h2>
    
    <div class="test-section">
      <h3>背景1: 渐变蓝</h3>
      <div class="bg-gradient">
        <img :src="huImage" alt="胡" class="hu-img" />
      </div>
    </div>

    <div class="test-section">
      <h3>背景2: 格子</h3>
      <div class="bg-grid">
        <img :src="huImage" alt="胡" class="hu-img" />
      </div>
    </div>

    <div class="test-section">
      <h3>背景3: 纯色</h3>
      <div class="bg-solid">
        <img :src="huImage" alt="胡" class="hu-img" />
      </div>
    </div>

    <div class="test-section">
      <h3>测试混合模式</h3>
      <div class="bg-gradient">
        <img :src="huImage" alt="胡" class="hu-img multiply" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
}

.test-section {
  margin-bottom: 24px;
}

.test-section h3 {
  margin-bottom: 12px;
}

.hu-img {
  height: 100px;
}

.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 8px;
}

.bg-grid {
  background-image: 
    linear-gradient(45deg, #ccc 25%, transparent 25%), 
    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #ccc 75%), 
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  padding: 20px;
  border-radius: 8px;
}

.bg-solid {
  background: #409eff;
  padding: 20px;
  border-radius: 8px;
}

.multiply {
  mix-blend-mode: multiply;
}
</style>
