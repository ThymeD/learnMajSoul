import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MahjongTile from '../MahjongTile.vue'

describe('MahjongTile', () => {
  it('renders with default width', () => {
    const wrapper = mount(MahjongTile, {
      props: { tileId: 'w1' }
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('alt')).toBe('1万')
  })

  it('renders with custom width', () => {
    const wrapper = mount(MahjongTile, {
      props: { tileId: 'w1', width: 60 }
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
  })

  it('renders correct tile name', () => {
    const wrapper = mount(MahjongTile, {
      props: { tileId: 'd1', showName: true }
    })
    expect(wrapper.text()).toContain('东风')
  })
})
