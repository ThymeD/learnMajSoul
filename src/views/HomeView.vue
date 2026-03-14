<script setup lang="ts">
</script>

<template>
  <div class="home">
    <h2>欢迎使用雀魂麻将攻略</h2>
    <p>这是一个帮助您提升雀魂麻将水平的工具。</p>
    <div class="cards">
      <router-link to="/hand" class="card">
        <h3>🀄 手牌分析</h3>
        <p>分析当前手牌的各种进张和改良</p>
      </router-link>
      <router-link to="/strategy" class="card">
        <h3>📖 策略指南</h3>
        <p>学习各种麻将策略和技巧</p>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.home h2 {
  margin-bottom: 16px;
  color: #2c3e50;
}

.cards {
  display: flex;
  gap: 24px;
  margin-top: 32px;
}

.card {
  flex: 1;
  max-width: 300px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.card h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.card p {
  margin: 0;
  color: #7f8c8d;
}
</style>
