<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const cards = [
  { path: '/hand', title: '手牌分析', desc: '分析当前手牌的各种进张和改良', icon: 'Grid' },
  { path: '/strategy', title: '策略指南', desc: '学习各种麻将策略和技巧', icon: 'Reading' }
]
</script>

<template>
  <div class="home">
    <h2>欢迎使用雀魂麻将攻略</h2>
    <p>这是一个帮助您提升雀魂麻将水平的工具。</p>
    <el-row :gutter="24" class="cards">
      <el-col :span="12" v-for="card in cards" :key="card.path">
        <el-card class="card" shadow="hover" @click="router.push(card.path)">
          <el-icon class="card-icon" :size="32"><component :is="card.icon" /></el-icon>
          <h3>{{ card.title }}</h3>
          <p>{{ card.desc }}</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home h2 {
  margin-bottom: 16px;
  color: #2c3e50;
}

.cards {
  margin-top: 32px;
}

.card {
  cursor: pointer;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
}

.card-icon {
  color: #409eff;
  margin-bottom: 12px;
}

.card h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.card p {
  margin: 0;
  color: #7f8c8d;
}
</style>
