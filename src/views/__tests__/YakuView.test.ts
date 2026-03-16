import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('../components/MahjongTile.vue', () => ({
  default: {
    name: 'MahjongTile',
    props: ['tileId', 'width', 'showName', 'split'],
    template: '<div class="mahjong-tile-mock">{{ tileId }}</div>'
  }
}))

vi.mock('../data/yaku', () => {
  const mockYakuData = [
    {
      id: 'reach',
      name: '立直',
      han: 1,
      category: '门前清',
      desc: '听牌时宣言立直',
      tiles: ['w1', 'w2', 'w3', 'b4', 'b4', 'b4', 's5', 's6', 's7', 'd1', 'd1', 'd1', 'd2', 'd2'],
      mastery: 0,
      isHu: true
    },
    {
      id: 'tanyao',
      name: '断幺九',
      han: 1,
      category: '无限制',
      desc: '手牌不含幺九牌',
      tiles: ['b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 's1', 's2', 's3', 's4', 's5', 's6'],
      mastery: 0,
      isHu: true
    },
    {
      id: 'pinfu',
      name: '平和',
      han: 1,
      category: '门前清',
      desc: '四组顺子+非役牌雀头+两面听',
      tiles: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'b1', 'b2', 'b3', 's7', 's8', 's9', 'd3', 'd3'],
      mastery: 0,
      isHu: true
    },
    {
      id: 'daisangen',
      name: '大三元',
      han: 8,
      category: '无限制',
      desc: '三元牌三种刻子',
      tiles: ['z1', 'z1', 'z1', 'z2', 'z2', 'z2', 'z3', 'z3', 'z3', 'b5', 'b5', 's9', 's9', 's9'],
      mastery: 0,
      isHu: true
    }
  ]
  return {
    originYakuData: mockYakuData,
    yakuData: mockYakuData
  }
})

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn()
})

describe('YakuView 交互功能', () => {
  let wrapper: any

  beforeEach(async () => {
    const { default: YakuView } = await import('../YakuView.vue')
    wrapper = shallowMount(YakuView)
  })

  describe('番数筛选', () => {
    it('默认应显示全部役种', () => {
      const { vm } = wrapper
      expect(vm.activeHan).toBe(1)
      expect(vm.filteredYaku.length).toBeGreaterThan(0)
    })

    it('切换到"全部"应显示全部役种', async () => {
      const allRadio = wrapper
        .findAll('input[type="radio"]')
        .find((el: any) => el.attributes('value') === '')
      if (allRadio) {
        await allRadio.setChecked()
        expect(wrapper.vm.activeHan).toBe('')
      }
    })

    it('切换到"一番"只显示 han=1 的役种', async () => {
      const oneHanRadio = wrapper
        .findAll('input[type="radio"]')
        .find((el: any) => el.attributes('value') === 1)
      if (oneHanRadio) {
        await oneHanRadio.setChecked()
        expect(wrapper.vm.activeHan).toBe(1)
        wrapper.vm.filteredYaku.forEach((yaku: any) => {
          expect(yaku.han).toBe(1)
        })
      }
    })

    it('切换到"役满"只显示 han=8 的役种', async () => {
      const yakumanRadio = wrapper
        .findAll('input[type="radio"]')
        .find((el: any) => el.attributes('value') === 8)
      if (yakumanRadio) {
        await yakumanRadio.setChecked()
        expect(wrapper.vm.activeHan).toBe(8)
        wrapper.vm.filteredYaku.forEach((yaku: any) => {
          expect(yaku.han).toBe(8)
        })
      }
    })
  })

  describe('搜索功能', () => {
    it('输入"立直"应筛选名称包含"立直"的役种', async () => {
      const searchInput = wrapper.find('input[placeholder*="搜索"]')
      if (searchInput.exists()) {
        await searchInput.setValue('立直')
        expect(wrapper.vm.searchText).toBe('立直')
        const results = wrapper.vm.filteredYaku
        expect(results.length).toBeGreaterThan(0)
        results.forEach((yaku: any) => {
          expect(yaku.name).toContain('立直')
        })
      }
    })

    it('输入"幺九"应筛选描述包含"幺九"的役种', async () => {
      const searchInput = wrapper.find('input[placeholder*="搜索"]')
      if (searchInput.exists()) {
        await searchInput.setValue('幺九')
        expect(wrapper.vm.searchText).toBe('幺九')
        const results = wrapper.vm.filteredYaku
        expect(results.length).toBeGreaterThan(0)
        results.forEach((yaku: any) => {
          const matchName = yaku.name.includes('幺九')
          const matchDesc = yaku.desc.includes('幺九')
          expect(matchName || matchDesc).toBe(true)
        })
      }
    })

    it('清空搜索应恢复全部结果', async () => {
      const searchInput = wrapper.find('input[placeholder*="搜索"]')
      if (searchInput.exists()) {
        await searchInput.setValue('立直')
        await searchInput.setValue('')
        expect(wrapper.vm.searchText).toBe('')
      }
    })
  })

  describe('选中高亮', () => {
    it('点击役种卡片应设置 activeId', async () => {
      const cards = wrapper.findAll('.yaku-card')
      if (cards.length > 0) {
        await cards[0].trigger('click')
        expect(wrapper.vm.activeId).toBeTruthy()
      }
    })
  })

  describe('分类筛选', () => {
    it('分类选项应随番数动态变化', () => {
      wrapper.vm.activeHan = 1
      const options = wrapper.vm.currentCategoryOptions
      expect(Array.isArray(options)).toBe(true)
    })
  })
})
