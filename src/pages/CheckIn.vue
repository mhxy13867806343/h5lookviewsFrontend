<template>
  <div class="checkin">
    <van-nav-bar title="每日签到" left-arrow @click-left="handleBack" />
    
    <div class="checkin-content">
      <!-- 签到状态卡片 -->
      <div class="checkin-status">
        <div class="status-card">
          <div class="card-header">
            <div class="today-info">
              <div class="date">{{ todayDate }}</div>
              <div class="weekday">{{ todayWeekday }}</div>
            </div>
            <div class="checkin-btn-container">
              <van-button 
                :type="todayChecked ? 'success' : 'primary'"
                :disabled="todayChecked"
                @click="handleCheckIn"
                class="checkin-btn"
                :loading="checkingIn"
              >
                {{ todayChecked ? '已签到' : '签到' }}
              </van-button>
            </div>
          </div>
          
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">{{ continuousDays }}</div>
              <div class="stat-label">连续签到</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-number">{{ totalDays }}</div>
              <div class="stat-label">累计签到</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-number">{{ monthDays }}</div>
              <div class="stat-label">本月签到</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 签到奖励 -->
      <div class="rewards-section">
        <div class="section-title">签到奖励</div>
        <div class="rewards-list">
          <div 
            v-for="(reward, index) in rewards" 
            :key="index"
            :class="['reward-item', { 'received': index < continuousDays, 'current': index === continuousDays }]"
          >
            <div class="reward-day">第{{ index + 1 }}天</div>
            <div class="reward-icon">
              <van-icon :name="reward.icon" :color="index < continuousDays ? '#ff976a' : '#ddd'" />
            </div>
            <div class="reward-name">{{ reward.name }}</div>
            <div v-if="index < continuousDays" class="received-mark">
              <van-icon name="success" color="#00b894" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 签到日历 -->
      <div class="calendar-section">
        <div class="section-title">
          <span>签到日历</span>
          <div class="calendar-nav">
            <van-icon name="arrow-left" @click="previousMonth" />
            <span class="current-month">{{ currentMonthText }}</span>
            <van-icon name="arrow" @click="nextMonth" />
          </div>
        </div>
        
        <div class="calendar">
          <div class="calendar-header">
            <div class="weekday-item" v-for="day in weekdays" :key="day">{{ day }}</div>
          </div>
          
          <div class="calendar-body">
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index"
              :class="['calendar-day', {
                'other-month': day.isOtherMonth,
                'today': day.isToday,
                'checked': day.isChecked,
                'future': day.isFuture
              }]"
            >
              <div class="day-number">{{ day.date }}</div>
              <div v-if="day.isChecked && !day.isOtherMonth" class="check-mark">
                <van-icon name="success" size="12" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 签到记录 -->
      <div class="records-section">
        <div class="section-title">最近签到记录</div>
        <div class="records-list">
          <div v-for="record in recentRecords" :key="record.id" class="record-item">
            <div class="record-date">{{ formatRecordDate(record.date) }}</div>
            <div class="record-reward">获得 {{ record.reward }}</div>
            <div class="record-time">{{ formatTime(record.date) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 签到成功弹窗 -->
    <van-popup v-model:show="showSuccessPopup" :style="{ padding: '40px 20px' }">
      <div class="success-popup">
        <div class="success-icon">
          <van-icon name="success" size="48" color="#00b894" />
        </div>
        <div class="success-title">签到成功</div>
        <div class="success-reward">获得 {{ todayReward }}</div>
        <div class="success-stats">连续签到 {{ continuousDays }} 天</div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import dayjs, { Dayjs } from 'dayjs'

// 类型定义
interface RewardItem {
  name: string
  icon: string
}

interface CheckInRecord {
  id: number
  date: Date
  reward: string
}

interface CalendarDay {
  date: number
  fullDate: string
  isOtherMonth: boolean
  isToday: boolean
  isFuture: boolean
  isChecked: boolean
}

const router = useRouter()

// 响应式数据
const todayChecked = ref<boolean>(false)
const checkingIn = ref<boolean>(false)
const continuousDays = ref<number>(5)
const totalDays = ref<number>(28)
const currentMonth = ref<Dayjs>(dayjs())
const checkedDates = ref<Set<string>>(new Set())
const showSuccessPopup = ref<boolean>(false)
const todayReward = ref<string>('')

// 签到奖励配置
const rewards: RewardItem[] = [
  { name: '积分+5', icon: 'gold-coin-o' },
  { name: '积分+10', icon: 'gold-coin-o' },
  { name: '积分+15', icon: 'gold-coin-o' },
  { name: '经验+20', icon: 'star-o' },
  { name: '积分+25', icon: 'gold-coin-o' },
  { name: '经验+30', icon: 'star-o' },
  { name: '神秘礼包', icon: 'gift-o' }
]

// 最近签到记录
const recentRecords = ref<CheckInRecord[]>([
  { id: 1, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), reward: '积分+15' },
  { id: 2, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), reward: '积分+10' },
  { id: 3, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), reward: '积分+5' },
  { id: 4, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), reward: '积分+5' },
  { id: 5, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), reward: '积分+5' }
])

const weekdays: string[] = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性
const todayDate = computed<string>(() => {
  return dayjs().format('MM月DD日')
})

const todayWeekday = computed<string>(() => {
  return `星期${'日一二三四五六'[dayjs().day()]}`
})

const monthDays = computed<number>(() => {
  const currentMonthStart = currentMonth.value.startOf('month')
  const currentMonthEnd = currentMonth.value.endOf('month')
  let count = 0
  
  for (let date of checkedDates.value) {
    const checkDate = dayjs(date)
    if (checkDate.isAfter(currentMonthStart.subtract(1, 'day')) && 
        checkDate.isBefore(currentMonthEnd.add(1, 'day'))) {
      count++
    }
  }
  
  return count
})

const currentMonthText = computed<string>(() => {
  return currentMonth.value.format('YYYY年MM月')
})

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const firstDay = currentMonth.value.startOf('month')
  const lastDay = currentMonth.value.endOf('month')
  const startDay = firstDay.startOf('week')
  const endDay = lastDay.endOf('week')
  
  let current = startDay
  while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
    const isCurrentMonth = current.isSame(currentMonth.value, 'month')
    const isToday = current.isSame(dayjs(), 'day')
    const isFuture = current.isAfter(dayjs(), 'day')
    const dateStr = current.format('YYYY-MM-DD')
    const isChecked = checkedDates.value.has(dateStr)
    
    days.push({
      date: current.date(),
      fullDate: current.format('YYYY-MM-DD'),
      isOtherMonth: !isCurrentMonth,
      isToday,
      isFuture,
      isChecked
    })
    
    current = current.add(1, 'day')
  }
  
  return days
})

// 方法
const handleBack = (): void => {
  router.back()
}

const handleCheckIn = async (): Promise<void> => {
  if (todayChecked.value) return
  
  checkingIn.value = true
  
  try {
    // 模拟签到API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    todayChecked.value = true
    continuousDays.value += 1
    totalDays.value += 1
    
    // 添加今天到签到记录
    const today = dayjs().format('YYYY-MM-DD')
    checkedDates.value.add(today)
    
    // 获取奖励
    const rewardIndex = (continuousDays.value - 1) % rewards.length
    todayReward.value = rewards[rewardIndex].name
    
    // 添加到记录
    recentRecords.value.unshift({
      id: Date.now(),
      date: new Date(),
      reward: todayReward.value
    })
    
    // 显示成功弹窗
    showSuccessPopup.value = true
    setTimeout(() => {
      showSuccessPopup.value = false
    }, 2000)
    
  } catch (error) {
    showSuccessToast('签到失败，请重试')
  } finally {
    checkingIn.value = false
  }
}

const previousMonth = (): void => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
}

const nextMonth = (): void => {
  const nextMonth = currentMonth.value.add(1, 'month')
  if (nextMonth.isBefore(dayjs().add(1, 'month'))) {
    currentMonth.value = nextMonth
  }
}

const formatRecordDate = (date: Date): string => {
  return dayjs(date).format('MM-DD')
}

const formatTime = (date: Date): string => {
  return dayjs(date).format('HH:mm')
}

// 初始化数据
const initializeData = (): void => {
  // 模拟已签到的日期
  const today = dayjs()
  for (let i = 1; i <= 5; i++) {
    const date = today.subtract(i, 'day').format('YYYY-MM-DD')
    checkedDates.value.add(date)
  }
  
  // 检查今天是否已签到
  const todayStr = today.format('YYYY-MM-DD')
  todayChecked.value = checkedDates.value.has(todayStr)
}

onMounted(() => {
  initializeData()
})
</script>

<style lang="scss" scoped>
.checkin {
  background-color: var(--background-primary);
  min-height: 100vh;
}

.checkin-content {
  padding: var(--spacing-md);
}

.checkin-status {
  margin-bottom: var(--spacing-lg);
  
  .status-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    color: white;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      
      .today-info {
        .date {
          font-size: var(--font-size-xl);
          font-weight: bold;
          margin-bottom: var(--spacing-xs);
        }
        
        .weekday {
          font-size: var(--font-size-md);
          opacity: 0.8;
        }
      }
      
      .checkin-btn {
        min-width: 80px;
        height: 40px;
        border-radius: 20px;
        font-weight: 500;
      }
    }
    
    .stats-row {
      display: flex;
      align-items: center;
      
      .stat-item {
        flex: 1;
        text-align: center;
        
        .stat-number {
          font-size: var(--font-size-xl);
          font-weight: bold;
          margin-bottom: var(--spacing-xs);
        }
        
        .stat-label {
          font-size: var(--font-size-sm);
          opacity: 0.8;
        }
      }
      
      .stat-divider {
        width: 1px;
        height: 30px;
        background: rgba(255, 255, 255, 0.3);
        margin: 0 var(--spacing-md);
      }
    }
  }
}

.rewards-section, .calendar-section, .records-section {
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  .section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.rewards-list {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
  
  .reward-item {
    flex-shrink: 0;
    width: 60px;
    text-align: center;
    position: relative;
    
    .reward-day {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }
    
    .reward-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--background-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--spacing-xs);
      border: 2px solid var(--border-color);
    }
    
    .reward-name {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }
    
    .received-mark {
      position: absolute;
      top: 15px;
      right: 5px;
      background: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    &.received {
      .reward-icon {
        border-color: #ff976a;
        background: #fff3e0;
      }
    }
    
    &.current {
      .reward-icon {
        border-color: var(--primary-color);
        background: #e3f2fd;
        animation: pulse 2s infinite;
      }
    }
  }
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  .current-month {
    font-size: var(--font-size-md);
    min-width: 100px;
    text-align: center;
  }
  
  .van-icon {
    cursor: pointer;
    padding: var(--spacing-xs);
    
    &:hover {
      color: var(--primary-color);
    }
  }
}

.calendar {
  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: var(--spacing-sm);
    
    .weekday-item {
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      padding: var(--spacing-sm) 0;
    }
  }
  
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: var(--background-primary);
      cursor: pointer;
      
      .day-number {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
      }
      
      .check-mark {
        position: absolute;
        bottom: 2px;
        right: 2px;
        color: #00b894;
      }
      
      &.other-month {
        .day-number {
          color: var(--text-secondary);
          opacity: 0.4;
        }
      }
      
      &.today {
        background: var(--primary-color);
        color: white;
        
        .day-number {
          color: white;
          font-weight: bold;
        }
      }
      
      &.checked {
        background: #e8f5e8;
        
        &.today {
          background: var(--primary-color);
        }
      }
      
      &.future {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.records-list {
  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color);
    
    &:last-child {
      border-bottom: none;
    }
    
    .record-date {
      font-size: var(--font-size-md);
      color: var(--text-primary);
      font-weight: 500;
    }
    
    .record-reward {
      font-size: var(--font-size-sm);
      color: #ff976a;
    }
    
    .record-time {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
}

.success-popup {
  text-align: center;
  
  .success-icon {
    margin-bottom: var(--spacing-md);
  }
  
  .success-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .success-reward {
    font-size: var(--font-size-md);
    color: #ff976a;
    margin-bottom: var(--spacing-xs);
  }
  
  .success-stats {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>