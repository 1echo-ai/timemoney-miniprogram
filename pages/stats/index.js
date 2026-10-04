const { getDaily } = require('../../utils/storage')

Page({
  data: {
    tab: 'income', // income | consume
    todayBase: '0.00',
    todayTotal: '0.00',
    totalEarned: '0.00',
    days: 1,
    empty: false
  },

  onShow() {
    const d = getDaily()
    if (!d) {
      this.setData({ empty: true, todayTotal: '0.00', todayBase: '0.00', totalEarned: '0.00' })
      return
    }
    const total = d.baseEarned + (d.overtimeEarned || 0)
    this.setData({
      empty: false,
      todayBase: d.baseEarned.toFixed(2),
      todayTotal: total.toFixed(2),
      totalEarned: total.toFixed(2)
    })
  },

  switchTab(e) {
    const t = e.currentTarget.dataset.tab
    this.setData({ tab: t })
  }
})