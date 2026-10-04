// utils/calc.js 纯计算引擎（原 calc.ts 的小程序版本）

// 时间字符串 → 当日秒数
function toSec(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 3600 + (m || 0) * 60
}

// 标准工作时长（秒）→ 从 start/end/lunch 计算
function calcStandardSec(workday) {
  const start = toSec(workday.start)
  const end = toSec(workday.end)
  const total = end - start
  if (total <= 0) return 0
  const lunch = (workday.lunchMin || 0) * 60
  return Math.max(0, total - lunch)
}

// 基础时薪（元/小时）
function hourlyWage(salary) {
  const hourly = Number(salary.hourly) || 0
  if (salary.isAfterTax) {
    // 税后转税前估算：税前 = 税后 / (1 - taxRate/100)
    const rate = Number(salary.taxRate) || 0
    return hourly / Math.max(0.01, 1 - rate / 100)
  }
  return hourly
}

// 每秒时薪
function perSecWage(salary) {
  return hourlyWage(salary) / 3600
}

// 今日：按已工作秒算收入（base + overtime）
function calcToday(salary, workday, workedSec) {
  const baseWage = hourlyWage(salary)
  const stdSec = calcStandardSec(workday)
  const overtimeSec = Math.max(0, workedSec - stdSec)
  const baseSec = workedSec - overtimeSec
  const baseEarned = (baseSec / 3600) * baseWage
  const overtimeEarned = (overtimeSec / 3600) * baseWage * (workday.overtimeRate || 1.5)
  return { baseEarned, overtimeEarned, overtimeSec, stdSec, total: baseEarned + overtimeEarned }
}

// 等效时薪 + 加班折损（工资按实际报酬 / 实际总时长）
function calcEffective(salary, workday, workedSec, baseEarned, overtimeActual) {
  const baseWage = hourlyWage(salary)
  const actualSec = Math.max(60, workedSec)
  // 等效时薪 = 实际到手的钱 / 实际总时长（加班无加班费时，加班时段按基础时薪算）
  const actualEarned = (actualSec / 3600) * baseWage
  const effective = actualEarned / (actualSec / 3600)
  const stdSec = calcStandardSec(workday)
  const overtimeSec = Math.max(0, workedSec - stdSec)
  // 应得加班费 vs 实得加班费
  const expectedOvertime = (overtimeSec / 3600) * baseWage * (workday.overtimeRate || 1.5)
  const actualOvertime = workday.noOvertimePay ? 0 : expectedOvertime
  const lostPay = Math.max(0, expectedOvertime - actualOvertime)
  const deltaPct = stdSec > 0 && actualSec > 0 ? ((effective - baseWage) / baseWage) * 100 : 0
  return { effective, baseWage, deltaPct, overtimeSec, expectedOvertime, actualOvertime, lostPay }
}

// 格式化金额
function fmt(n, decimals) {
  if (n === undefined || n === null || isNaN(n)) n = 0
  const d = decimals === undefined ? 2 : decimals
  return n.toFixed(d)
}

module.exports = {
  toSec, calcStandardSec, hourlyWage, perSecWage, calcToday, calcEffective, fmt
}