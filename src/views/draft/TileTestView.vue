<script setup lang="ts">
import { ref } from 'vue'

const borderRadius = ref(4)
const borderWidth = ref(1)
const borderColor = ref('#ebeef5')
const shadow = ref('')
const selectedTile = ref('w1')
const size = ref<'small' | 'medium' | 'large'>('medium')

const tileOptions = [
  'w1', 'w5', 'w9',
  'b1', 'b5', 'b9',
  's1', 's5', 's9',
  'd1', 'd2', 'd3', 'd4',
  'z1', 'z2', 'z3'
]

const updateShadow = () => {
  if (shadow.value) {
    borderColor.value = '#dcdfe6'
  } else {
    borderColor.value = '#ebeef5'
  }
}
</script>

<template>
  <div class="tile-style-test">
    <h2>麻将组件样式微调 - 草稿区</h2>
    <el-row :gutter="24">
      <el-col :span="8">
        <el-card header="样式调整">
          <el-form label-width="80px">
            <el-form-item label="圆角">
              <el-slider v-model="borderRadius" :min="0" :max="200" show-input />
            </el-form-item>
            <el-form-item label="边框宽度">
              <el-slider v-model="borderWidth" :min="0" :max="200" show-input />
            </el-form-item>
            <el-form-item label="边框颜色">
              <el-color-picker v-model="borderColor" />
            </el-form-item>
            <el-form-item label="阴影">
              <el-switch v-model="shadow" @change="updateShadow" />
            </el-form-item>
            <el-form-item label="尺寸">
              <el-radio-group v-model="size">
                <el-radio-button value="small">小</el-radio-button>
                <el-radio-button value="medium">中</el-radio-button>
                <el-radio-button value="large">大</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card header="选择测试牌">
          <div class="tile-selector">
            <el-radio-group v-model="selectedTile">
              <el-radio-button v-for="t in tileOptions" :key="t" :value="t">{{ t }}</el-radio-button>
            </el-radio-group>
          </div>
          <el-divider />
          <div class="preview-area">
            <img 
              :src="`/src/assets/mahjong/${selectedTile}.jpg`" 
              class="preview-image"
              :style="{
                borderRadius: borderRadius + 'px',
                borderWidth: borderWidth + 'px',
                borderStyle: 'solid',
                borderColor: borderColor,
                boxShadow: shadow ? '0 2px 12px rgba(0,0,0,0.15)' : 'none'
              }"
            />
            <div class="preview-code">
              <code>border-radius: {{ borderRadius }}px</code><br/>
              <code>border: {{ borderWidth }}px solid {{ borderColor }}</code><br/>
              <code>box-shadow: {{ shadow ? '0 2px 12px rgba(0,0,0,0.15)' : 'none' }}</code>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.tile-style-test h2 {
  margin-bottom: 24px;
  color: #303133;
}

.tile-selector {
  margin-bottom: 16px;
}

.preview-area {
  display: flex;
  align-items: center;
  gap: 32px;
}

.mahjong-tile-preview {
  display: inline-block;
  border-style: solid;
  background: #fff;
}

.preview-image {
  display: block;
}

.small .preview-image {
  width: 40px;
  height: 53px;
}

.medium .preview-image {
  width: 60px;
  height: 80px;
}

.large .preview-image {
  width: 80px;
  height: 107px;
}

.preview-code {
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}

.preview-code code {
  font-family: monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
