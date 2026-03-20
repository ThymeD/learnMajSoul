<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ruleReviewItems, type RuleMode } from '../data/rule-review-items'
import { loadNormalizedObjectMap, saveNormalizedObjectMap } from '../utils/storage-map'

type DecisionValue = 'accept' | 'keep' | 'defer' | 'need-info' | ''

interface RuleDecision {
  value: DecisionValue
  note: string
  reference: string
}

const STORAGE_KEY = 'majsoul_rule_review_decisions_v1'
const modeFilter = ref<RuleMode | 'all' | 'shared'>('all')
const categoryFilter = ref<'all' | (typeof ruleReviewItems)[number]['category']>('all')
const unresolvedOnly = ref(false)
const searchText = ref('')

const decisions = reactive<Record<string, RuleDecision>>({})

const LEGACY_RULE_REVIEW_ID_MAP: Record<string, string> = {}

function normalizeRuleReviewId(id: string): string {
  return LEGACY_RULE_REVIEW_ID_MAP[id] || id
}

function initDecisions() {
  for (const item of ruleReviewItems) {
    if (!decisions[item.id]) {
      decisions[item.id] = {
        value: '',
        note: '',
        reference: ''
      }
    }
  }
}

function loadDecisions() {
  try {
    const parsed = loadNormalizedObjectMap<RuleDecision>(STORAGE_KEY, normalizeRuleReviewId)
    for (const item of ruleReviewItems) {
      const fromStorage = parsed[normalizeRuleReviewId(item.id)]
      if (fromStorage) {
        decisions[item.id] = {
          value: fromStorage.value || '',
          note: fromStorage.note || '',
          reference: fromStorage.reference || ''
        }
      }
    }
  } catch {
    // ignore invalid storage
  }
}

function saveDecisions() {
  const plain: Record<string, RuleDecision> = {}
  Object.keys(decisions).forEach((key) => {
    plain[key] = { ...decisions[key] }
  })
  saveNormalizedObjectMap(STORAGE_KEY, plain, normalizeRuleReviewId)
}

initDecisions()
loadDecisions()

watch(
  decisions,
  () => {
    saveDecisions()
  },
  { deep: true }
)

const categoryOptions = computed(() => {
  return ['all', ...new Set(ruleReviewItems.map((item) => item.category))] as const
})

const filteredItems = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return ruleReviewItems.filter((item) => {
    const modePass =
      modeFilter.value === 'all' ||
      (modeFilter.value === 'shared' && item.mode === 'both') ||
      (modeFilter.value === 'yonma' && item.mode === 'yonma') ||
      (modeFilter.value === 'sanma' && item.mode === 'sanma')
    const categoryPass = categoryFilter.value === 'all' || item.category === categoryFilter.value
    const unresolvedPass = !unresolvedOnly.value || decisions[item.id]?.value === ''
    const searchPass =
      keyword.length === 0 ||
      item.title.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword) ||
      item.question.toLowerCase().includes(keyword)
    return modePass && categoryPass && unresolvedPass && searchPass
  })
})

const totalCount = computed(() => ruleReviewItems.length)
const confirmedCount = computed(() => {
  return ruleReviewItems.filter((item) => decisions[item.id]?.value !== '').length
})
const pendingCount = computed(() => totalCount.value - confirmedCount.value)

function clearAll() {
  for (const item of ruleReviewItems) {
    decisions[item.id] = {
      value: '',
      note: '',
      reference: ''
    }
  }
  ElMessage.success('已清空全部复核记录')
}
</script>

<template>
  <div class="rule-review-page">
    <div class="page-header">
      <h2>规则复核面板（雀魂三麻/四麻）</h2>
      <div class="summary">
        <el-tag type="info">总项：{{ totalCount }}</el-tag>
        <el-tag type="success">已确认：{{ confirmedCount }}</el-tag>
        <el-tag type="warning">待确认：{{ pendingCount }}</el-tag>
      </div>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filters">
        <div class="filter-item">
          <span class="label">模式</span>
          <el-segmented
            v-model="modeFilter"
            :options="[
              { label: '全部', value: 'all' },
              { label: '三麻/四麻', value: 'shared' },
              { label: '四麻', value: 'yonma' },
              { label: '三麻', value: 'sanma' }
            ]"
          />
        </div>

        <div class="filter-item">
          <span class="label">类别</span>
          <el-select v-model="categoryFilter" style="width: 180px">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </div>

        <div class="filter-item">
          <el-checkbox v-model="unresolvedOnly">只看待确认</el-checkbox>
        </div>

        <div class="filter-item grow">
          <el-input v-model="searchText" clearable placeholder="搜索标题、原因、问题" />
        </div>

        <div class="filter-item">
          <el-button type="danger" plain @click="clearAll">清空本地记录</el-button>
        </div>
      </div>
    </el-card>

    <div class="tips">
      <el-alert
        type="info"
        show-icon
        :closable="false"
        title="每条都可选择建议方向，并在“补充信息入口”填写你的规则说明、例外情况、参考链接。记录会自动保存在本地。"
      />
    </div>

    <div class="item-list">
      <el-card v-for="item in filteredItems" :key="item.id" shadow="hover" class="item-card">
        <template #header>
          <div class="item-header">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-tags">
              <el-tag size="small" :type="item.mode === 'both' ? 'info' : 'success'">
                {{ item.mode === 'yonma' ? '四麻' : item.mode === 'sanma' ? '三麻' : '三麻/四麻' }}
              </el-tag>
              <el-tag size="small" type="warning">{{ item.category }}</el-tag>
              <el-tag size="small" :type="decisions[item.id]?.value ? 'success' : 'danger'">
                {{ decisions[item.id]?.value ? '已处理' : '待确认' }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="item-body">
          <div class="block">
            <div class="block-label">分析理由</div>
            <div class="block-content">{{ item.reason }}</div>
          </div>

          <div class="block">
            <div class="block-label">待确认问题</div>
            <div class="block-content">{{ item.question }}</div>
          </div>

          <div class="block">
            <div class="block-label">你的决策</div>
            <el-radio-group v-model="decisions[item.id].value" class="options">
              <el-radio v-for="opt in item.options" :key="opt.id" :value="opt.id">{{ opt.label }}</el-radio>
            </el-radio-group>
          </div>

          <div class="block">
            <div class="block-label">补充信息入口</div>
            <el-input
              v-model="decisions[item.id].note"
              type="textarea"
              :rows="3"
              placeholder="填写你的补充说明：规则依据、例外、判定边界、优先级等"
            />
            <el-input
              v-model="decisions[item.id].reference"
              class="mt8"
              placeholder="可选：补充参考链接（雀魂规则页/维基/你确认的文档）"
            />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.rule-review-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h2 {
  margin: 0;
}

.summary {
  display: flex;
  gap: 8px;
}

.filter-card {
  margin-top: 4px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item.grow {
  flex: 1;
  min-width: 260px;
}

.label {
  color: #606266;
  font-size: 13px;
}

.item-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-title {
  font-weight: 600;
}

.item-tags {
  display: flex;
  gap: 6px;
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-label {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.block-content {
  color: #303133;
  line-height: 1.6;
}

.options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.mt8 {
  margin-top: 8px;
}
</style>
