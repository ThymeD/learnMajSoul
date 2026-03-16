<script setup lang="ts">
import { ref } from 'vue'
import MasteryStars from '../../components/MasteryStars.vue'

const mastery = ref(2)

const handleUpdate = (val: number) => {
  console.log('mastery:', val)
}
</script>

<template>
  <div class="page">
    <h2>胡牌次数测试</h2>
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>立直</span>
          <MasteryStars v-model="mastery" @update:model-value="handleUpdate" />
        </div>
      </template>
      <p>点击 + 按钮增加胡牌次数</p>
    </el-card>

    <div class="actions">
      <el-button type="primary" @click="mastery++">胡牌 +1</el-button>
      <el-button @click="mastery = 0">重置</el-button>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
}

.test-card {
  max-width: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
