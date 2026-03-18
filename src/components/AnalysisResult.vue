<script setup lang="ts">
import MahjongTile from './MahjongTile.vue'
import type { AnalysisResult as AnalysisResultType } from '../stores/hand'

interface Props {
  result: AnalysisResultType | null
}

const props = defineProps<Props>()

// 计算听牌位置映射
const tingCountMap = (() => {
  if (!props.result?.tingPai) return {}
  const map: Record<string, number> = {}
  props.result.tingPai.forEach((tile) => {
    map[tile] = (map[tile] || 0) + 1
  })
  return map
})()
</script>

<template>
  <div class="analysis-result">
    <!-- 校验错误提示 -->
    <div v-if="result?.error" class="result-error">
      <el-alert type="error" :title="result.error" :closable="false" show-icon />
    </div>

    <template v-else-if="result">
      <!-- 状态标签 -->
      <div class="result-item">
        <span class="result-label">状态：</span>
        <el-tag :type="result.isHu ? 'success' : result.isTing ? 'warning' : 'info'">
          {{ result.isHu ? '胡牌' : result.isTing ? '听牌' : '未听牌' }}
        </el-tag>
      </div>

      <!-- 听牌列表 -->
      <div v-if="result.tingPai.length > 0" class="result-item">
        <span class="result-label">听牌：</span>
        <div class="ting-tiles">
          <span v-for="(count, tile) in tingCountMap" :key="tile" class="ting-tile">
            <MahjongTile :tile-id="tile" :width="36" :show-name="false" />
            <span class="ting-count">×{{ count }}</span>
          </span>
        </div>
      </div>

      <!-- 振听状态 -->
      <div class="result-item">
        <span class="result-label">振听：</span>
        <el-tag :type="result.zhenTing ? 'danger' : 'success'">
          {{ result.zhenTing ? '是' : '否' }}
        </el-tag>
      </div>

      <!-- 役种列表 -->
      <div class="result-item yaku-list">
        <span class="result-label">役种：</span>
        <div class="yaku-content">
          <template v-if="result.yaku.length > 0">
            <div class="yaku-names">
              <el-tag
                v-for="yaku in result.yaku"
                :key="yaku"
                type="success"
                size="small"
                class="yaku-tag"
              >
                {{ yaku }}
              </el-tag>
            </div>
            <div class="yaku-summary">共 {{ result.han }} 番</div>
          </template>
          <span v-else class="no-yaku">无</span>
        </div>
      </div>
    </template>

    <!-- 无结果时 -->
    <div v-else class="no-result">
      <span>点击"分析"按钮查看手牌分析结果</span>
    </div>
  </div>
</template>

<style scoped>
.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-error {
  margin-bottom: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-label {
  color: #606266;
  font-weight: 500;
  min-width: 60px;
}

.ting-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ting-tile {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ting-count {
  font-size: 12px;
  color: #e6a23c;
  margin-left: 2px;
}

.yaku-list {
  flex-direction: column;
  align-items: flex-start;
}

.yaku-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.yaku-names {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.yaku-tag {
  margin-right: 4px;
}

.yaku-summary {
  color: #67c23a;
  font-weight: 500;
}

.no-yaku {
  color: #909399;
}

.no-result {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>
