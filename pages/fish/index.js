const { hourlyWage, perSecWage } = require('../../utils/calc')
const { getSettings } = require('../../utils/storage')

// 摸鱼模式（按每秒时薪判定）
function fishMode(psw) {
  if (psw >= 0.1) return { name: '巨富', label: '金元宝级', color: '#ffd76a' }
  if (psw >= 0.05) return { name: '小富', label: '银锭级', color: '#c9d8e8' }
  if (psw >= 0.01) return { name: '中产', label: '铜板级', color: '#e8a05a' }
  return { name: '拮据', label: '碎铜级', color: '#a06a3a' }
}

Page({
  data: {
    total: '0.00',
    taps: 0,
    modeName: '中产',
    modeLabel: '铜板级',
    perSec: '0.00',
    soundOn: true,
    lastAmount: '—',
    lastTapAt: 0,
    modeColor: '#e8a05a'
  },

  onLoad() {
    // 初始化本地统计
    this.stats = { total: 0, taps: 0 }
    try {
      const saved = wx.getStorageSync('fish_stats')
      if (saved) this.stats = saved
    } catch (e) {}
    this._refresh()
  },

  _refresh() {
    const s = getSettings()
    const psw = perSecWage(s.salary)
    const mode = fishMode(psw)
    this.setData({
      total: this.stats.total.toFixed(2),
      taps: this.stats.taps,
      perSec: psw.toFixed(4),
      modeName: mode.name,
      modeLabel: mode.label,
      modeColor: mode.color
    })
  },

  onTap() {
    const s = getSettings()
    const psw = perSecWage(s.salary)
    const now = Date.now()
    // 金额 = 距上次敲击间隔时间 * 每秒时薪（首敲按 1 秒）
    const gapSec = this.data.lastTapAt ? Math.max(0.2, (now - this.data.lastTapAt) / 1000) : 1
    const amount = psw * gapSec
    this.stats.total += amount
    this.stats.taps += 1
    wx.setStorageSync('fish_stats', this.stats)
    this.setData({
      total: this.stats.total.toFixed(2),
      taps: this.stats.taps,
      lastAmount: '+' + amount.toFixed(4),
      lastTapAt: now
    })
    // 震动
    wx.vibrateShort({ type: 'light' })
  },

  onToggleSound(e) {
    this.setData({ soundOn: e.detail.value })
  },

  clearToday() {
    this.stats = { total: 0, taps: 0 }
    wx.setStorageSync('fish_stats', this.stats)
    this.setData({ total: '0.00', taps: 0, lastAmount: '—' })
    wx.showToast({ title: '已清空', icon: 'success' })
  }
})