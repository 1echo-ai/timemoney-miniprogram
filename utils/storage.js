// utils/storage.js 本地存储封装
// 数据模型：
//  settings: { salary: {hourly, isAfterTax, taxRate}, workday: {start, end, lunchMin, dayMode, workdaysPerMonth, overtimeRate, noOvertimePay} }
//  daily:    { dateKey, baseEarned, overtimeEarned, workedSec }   // 当日累计，跨天重置

const KEYS = {
  SETTINGS: 'tm_settings',
  DAILY: 'tm_daily'
}

function _todayKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ---------- 默认配置 ----------
const DEFAULT_SETTINGS = {
  salary: {
    hourly: 50,          // 基础时薪（元/小时）
    isAfterTax: false,   // 时薪是否为税后
    taxRate: 10          // 年有效税率 %
  },
  workday: {
    start: '09:00',
    end: '18:00',
    lunchMin: 60,        // 午休分钟
    dayMode: 'fixed',    // fixed | monthly
    workdaysPerMonth: 22,
    overtimeRate: 1.5,
    noOvertimePay: true  // 加班无加班费（默认：被白嫖）
  }
}

function getSettings() {
  try {
    const raw = wx.getStorageSync(KEYS.SETTINGS)
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    // 简易 merge，兼容旧数据
    const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    return {
      salary: Object.assign({}, base.salary, raw.salary),
      workday: Object.assign({}, base.workday, raw.workday)
    }
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
  }
}

function saveSettings(s) {
  wx.setStorageSync(KEYS.SETTINGS, s)
}

function patchSettings(patch) {
  const s = getSettings()
  const next = Object.assign({}, s, patch)
  saveSettings(next)
  return next
}

// ---------- 当日记录 ----------
function getDaily() {
  try {
    return wx.getStorageSync(KEYS.DAILY) || null
  } catch (e) {
    return null
  }
}

function saveDaily(d) {
  wx.setStorageSync(KEYS.DAILY, d)
}

// 跨天校验：若 session 跨天，返回新一天的日记录
function ensureToday(daily) {
  const key = _todayKey()
  if (daily && daily.dateKey === key) return daily
  const fresh = { dateKey: key, baseEarned: 0, overtimeEarned: 0, workedSec: 0 }
  saveDaily(fresh)
  return fresh
}

// 累加当日收入
function addDaily(delta) {
  const d = ensureToday(getDaily())
  if (delta.baseEarned) d.baseEarned += delta.baseEarned
  if (delta.overtimeEarned) d.overtimeEarned += delta.overtimeEarned
  if (delta.workedSec) d.workedSec += delta.workedSec
  saveDaily(d)
  return d
}

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  patchSettings,
  getDaily,
  saveDaily,
  ensureToday,
  addDaily,
  todayKey: _todayKey
}