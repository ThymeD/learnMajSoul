# Bug 修复报告：素材区拖拽到牌河区功能

## 1. 为什么之前的代码没有实现该需求

### 根本原因

在 `TileSelector.vue` 的 `handleSourceDragStart` 函数中，**错误地在 dragstart 事件处理时调用了 `emit('select', tileId)`**。

```typescript
// 原代码（第267行）
const handleSourceDragStart = (event: DragEvent, tileId: string) => {
  if (!hasRemaining(tileId) || isTileDisabled(tileId)) {
    event.preventDefault()
    return
  }
  // 通知父组件减少素材区数量（通过 select 事件，父组件会将牌添加到其他区域）
  emit('select', tileId) // <-- 错误：这里不应该 emit
  if (event.dataTransfer) {
    // ...
  }
}
```

### 问题分析

`emit('select', tileId)` 会触发父组件的 `handleTileAdd`，将牌**添加到手牌**而不是减少素材区数量。这导致：

1. **dragstart 时手牌数量就增加了**，而不是在 drop 时才增加
2. 如果手牌已满（13张），`handleTileAdd` 会失败并返回，手牌数量不变
3. 即使手牌没满，手牌数量在 dragstart 时就 +1，这可能影响后续 `isTileDisabled` 的计算（selectedTiles 变化）
4. **素材区数量没有在 dragstart 时减少**，而是在 drop 成功时通过 `consumedFromSource` 减少，但此时 `isTileDisabled` 的计算可能已经出错

### 副作用

当用户尝试从素材区拖牌时：

- 如果手牌接近满（12-13张），拖拽可能因为 `isTileDisabled` 计算错误而被阻止
- 或者拖拽成功但手牌数量异常增加

## 2. 分析过程

### 代码审查发现

1. **TileSelector.vue 第262-273行**：`handleSourceDragStart` 中有 `emit('select', tileId)`
2. **index.vue 第65-71行**：`handleTileAdd` 会调用 `store.addTile(tile)`，将牌添加到手牌
3. **index.vue 第485-523行**：`handleRiverDrop` 处理 source === 'source' 时，会调用 `store.addConsumedFromSource(tileId)` 来记录素材区消耗

### 流程对比

**错误流程**（原代码）：

```
dragstart 触发
  -> emit('select', tileId)
  -> handleTileAdd() // 手牌 +1
  -> dataTransfer 设置数据
  -> 拖拽到 .river-container
  -> drop 触发
  -> handleRiverDrop(source === 'source')
  -> store.river.push(tileId)
  -> store.addConsumedFromSource(tileId)
  -> 手牌数量异常（dragstart 时已 +1）
```

**正确流程**（修复后）：

```
dragstart 触发
  -> 只设置 dataTransfer 数据（tileId, source='source'）
  -> 拖拽到 .river-container
  -> drop 触发
  -> handleRiverDrop(source === 'source')
  -> store.river.push(tileId)
  -> store.addConsumedFromSource(tileId)
  -> usedTiles 响应式更新
  -> 素材区数量正确减少
```

## 3. 修复方案

### 修改文件

`src/components/TileSelector.vue`

### 修改内容

删除 `handleSourceDragStart` 中的 `emit('select', tileId)` 调用：

```typescript
// 修复后的代码
const handleSourceDragStart = (event: DragEvent, tileId: string) => {
  if (!hasRemaining(tileId) || isTileDisabled(tileId)) {
    event.preventDefault()
    return
  }
  // 删除：emit('select', tileId)  // 不应在 dragstart 时 emit
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tileId)
    event.dataTransfer.setData('source', 'source')
    event.dataTransfer.effectAllowed = 'copy'
  }
}
```

### 修复原理

- **dragstart**：只负责设置 dataTransfer 数据，通知素材区数量更新是 drop 成功后的职责
- **drop 成功**：`handleRiverDrop` 中 `store.addConsumedFromSource(tileId)` 更新 `usedTiles`，触发素材区数量响应式减少
- **drop 取消**：素材区数量不变（因为 dragstart 时没有更新）

## 4. 判断问题已修复的依据

### 构建验证

```bash
npm run build  # 成功，无编译错误
```

### 逻辑验证

1. **dragstart 时**：只设置 dataTransfer，不改变任何状态
2. **drop 到牌河时**：正确更新 `store.river` 和 `consumedFromSource`
3. **usedTiles 计算**：正确包含 `consumedFromSource`，素材区数量响应式更新
4. **无副作用**：不会在 dragstart 时错误地增加手牌数量

### 数据流验证

```
素材区拖拽 -> dragstart (设置 dataTransfer)
    -> drop 到牌河 -> handleRiverDrop
    -> store.river.push(tileId)
    -> store.addConsumedFromSource(tileId)
    -> usedTiles computed 响应式更新
    -> TileSelector watch 触发
    -> updateSourceTilesFromUsedTiles()
    -> 素材区数量正确减少
```

## 关键教训

1. **dragstart 事件中不应该有副作用**：只应设置拖拽相关的数据，不应触发业务逻辑
2. **emit('select') 是为点击添加设计的**：用于 drag 场景是误用
3. **状态更新应在 drop 成功时进行**：而非 dragstart 时

## 相关代码位置

| 文件                              | 行号    | 说明                               |
| --------------------------------- | ------- | ---------------------------------- |
| `src/components/TileSelector.vue` | 262-273 | handleSourceDragStart（已修复）    |
| `src/components/TileSelector.vue` | 285     | handleSourceDrop（素材区接收拖回） |
| `src/views/HandView/index.vue`    | 485-523 | handleRiverDrop（牌河接收拖入）    |
| `src/stores/hand.ts`              | 415-417 | addConsumedFromSource              |
| `src/views/HandView/index.vue`    | 276-287 | usedTiles computed                 |
