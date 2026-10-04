const { toSec, calcStandardSec, hourlyWage } = require('../../utils/calc')
const { getSettings } = require('../../utils/storage')

Page({
  data: {
    priceInput: '',
    psw: '0.00',
    calcText: '',
    price: '',
    productName: '',
    syncTaxAfter: true,
    currencySymbol: '¥'
  },

  onShow() {
    this.settings = getSettings()
    // 每秒时薪（税后显示用）
    const s = getSettings()
    const hw = hourlyWage(s.salary)
    this.setData({ psw: (hw / 3600).toFixed(4) })
  },

  onPrice(e) {
    this.setData({ price: e.detail.value })
    this._recalc()
  },
  onName(e) {
    this.setData({ productName: e.detail.value })
  },
  onToggleSync(e) {
    this.setData({ syncTaxAfter: e.detail.value })
    this._recalc()
  },

  _recalc() {
    const price = Number(this.data.price)
    if (!price || price <= 0) {
      this.setData({ priceInput: '', calcText: '', psw: this.data.psw })
      return
    }
    // 每秒收入（若同步税后且选了税后，则展示税后每秒）
    const pswNum = Number(this.data.psw) || 0
    const seconds = pswNum > 0 ? price / pswNum : 0
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const priceStr = `¥${price.toFixed(2)}`
    const hoursStr = `${h}小时${m}分${s}秒`
    const pslNum = pswNum * 3600
    this.setData({
      priceInput: priceStr,
      calcText: `需连续打工 ${hoursStr}`
    })
    return { priceStr, hoursStr, pslNum }
  }
})