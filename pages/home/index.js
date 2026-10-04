const { toSec, calcStandardSec, hourlyWage, perSecWage, calcToday, calcEffective, fmt } = require('../../utils/calc')
const { getSettings, patchSettings } = require('../../utils/storage')

// 读取配置弹窗用到的数据初始值，避免无法读取 deep field 报错
function field(obj, key, fallback) {
  return obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : fallback
}

Page({
  data: {
    todayEarned: '0.00',
    perSec: '0.00',
    effective: '0.00',
    effDelta: 0,
    overtimeText: '',
    stdSec: 0,
    workedSec: 0,
    status: 'working', // working | overtime_unpaid | overtime_paid | idle
    showSettings: false,
    // 设置表单
    sHourly: 50,
    sStart: '09:00',
    sEnd: '18:00',
    sLunch: 60,
    sNoOvertime: true,
    sOvertimeRate: 1.5,
    sIsAfterTax: false,
    sTaxRate: 10
  },

  onLoad() {
    this.tickTimer = null
    this._loadSettings()
    this._tick()
    this.tickTimer = setInterval(() => this._tick(), 1000)
  },

  onUnload() {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null }
  },

  _loadSettings() {
    const s = getSettings()
    this.settings = s
    this.setData({
      sHourly: field(s.salary, 'hourly', 50),
      sStart: field(s.workday, 'start', '09:00'),
      sEnd: field(s.workday, 'end', '18:00'),
      sLunch: field(s.workday, 'lunchMin', 60),
      sNoOvertime: field(s.workday, 'noOvertimePay', true),
      sOvertimeRate: field(s.workday, 'overtimeRate', 1.5),
      sIsAfterTax: field(s.salary, 'isAfterTax', false),
      sTaxRate: field(s.salary, 'taxRate', 10)
    })
  },

  // 实时计算
  _tick() {
    this._recalc()
  },

  _recalc() {
    const now = new Date()
    const s = this.settings
    if (!s) return
    const stdSec = calcStandardSec(s.workday)
    // 计算已工作秒数
    const curSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const startSec = toSec(s.workday.start)
    const endSec = toSec(s.workday.end)
    const workedSec = curSec >= startSec && curSec <= endSec ? curSec - startSec : 0

    const psw = perSecWage(s.salary)
    const today = calcToday(s.salary, s.workday, workedSec)
    const eff = calcEffective(s.salary, s.workday, workedSec, today.baseEarned, today.overtimeEarned)

    let status = 'working'
    if (eff.overtimeSec > 0) status = s.workday.noOvertimePay ? 'overtime_unpaid' : 'overtime_paid'
    if (workedSec === 0) status = 'idle'

    const overtimeText = eff.overtimeSec > 0
      ? `加班${Math.floor(eff.overtimeSec / 3600)}时${Math.floor((eff.overtimeSec % 3600) / 60)}分${s.workday.noOvertimePay ? '无补偿' : ''}`
      : ''

    const workingHours = `${Math.floor(workedSec / 3600)}时${Math.floor((workedSec % 3600) / 60)}分`
    const remainSec = Math.max(0, stdSec - workedSec)
    const remainingMinutes = `${Math.floor(remainSec / 3600)}时${Math.floor((remainSec % 3600) / 60)}分`
    const overtimeRateTxt = `${s.workday.overtimeRate || 1.5}x`

    this.setData({
      todayEarned: fmt(today.total, 2),
      perSec: fmt(psw, 4),
      effective: fmt(eff.effective, 2),
      effDelta: Math.round(eff.deltaPct),
      overtimeText,
      workingHours,
      remainingMinutes,
      baseToday: fmt(today.baseEarned, 2),
      overtimeToday: fmt(today.overtimeEarned, 2),
      overtimeRateTxt,
      lostPay: fmt(eff.lostPay, 2),
      expectedOvertime: fmt(eff.expectedOvertime, 2),
      stdSec,
      workedSec,
      status
    })
  },

  // 打开/关闭配置弹窗
  openSettings() { this._loadSettings(); this.setData({ showSettings: true }) },
  closeSettings() { this.setData({ showSettings: false }) },
  noop() {},

  // 表单绑定
  onHourly(e) { this.setData({ sHourly: e.detail.value }) },
  onStart(e) { this.setData({ sStart: e.detail.value }) },
  onEnd(e) { this.setData({ sEnd: e.detail.value }) },
  onLunch(e) { this.setData({ sLunch: e.detail.value }) },
  onOvertimeRate(e) { this.setData({ sOvertimeRate: e.detail.value }) },
  onToggleOvertime(e) { this.setData({ sNoOvertime: e.detail.value }) },
  onToggleTax(e) { this.setData({ sIsAfterTax: e.detail.value }) },
  onTaxRate(e) { this.setData({ sTaxRate: e.detail.value }) },

  // 保存配置
  saveSettings() {
    const next = {
      salary: {
        hourly: Number(this.data.sHourly) || 0,
        isAfterTax: this.data.sIsAfterTax,
        taxRate: Number(this.data.sTaxRate) || 0
      },
      workday: {
        start: this.data.sStart,
        end: this.data.sEnd,
        lunchMin: Number(this.data.sLunch) || 0,
        dayMode: 'fixed',
        workdaysPerMonth: 22,
        overtimeRate: Number(this.data.sOvertimeRate) || 1.5,
        noOvertimePay: this.data.sNoOvertime
      }
    }
    this.settings = patchSettings(next)
    this.setData({ showSettings: false })
    this._tick()
    wx.showToast({ title: '已保存', icon: 'success' })
  }
})