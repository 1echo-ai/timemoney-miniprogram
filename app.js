// app.js 小程序全局入口
const { getSettings, saveSettings, getDaily, saveDaily } = require('./utils/storage')

App({
  globalData: {
    settings: null,
    daily: null
  },

  onLaunch() {
    // 初始化本地存储
    const settings = getSettings()
    let daily = getDaily()
    // 若跨天则重置当日记录
    if (daily && daily.dateKey !== this._todayKey()) {
      daily = { dateKey: this._todayKey(), baseEarned: 0, overtimeEarned: 0, workedSec: 0 }
      saveDaily(daily)
    }
    this.globalData.settings = settings
    this.globalData.daily = daily
  },

  _todayKey() {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  }
})