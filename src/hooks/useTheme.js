import { ref, computed } from 'vue'

const isDark = ref(false)

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
  }

  const setTheme = (theme) => {
    isDark.value = theme === 'dark'
    updateTheme()
  }

  const updateTheme = () => {
    const root = document.documentElement
    if (isDark.value) {
      root.style.setProperty('--text-primary', '#ffffff')
      root.style.setProperty('--text-secondary', '#cccccc')
      root.style.setProperty('--background-primary', '#1a1a1a')
      root.style.setProperty('--background-secondary', '#2d2d2d')
      root.style.setProperty('--border-color', '#404040')
    } else {
      root.style.setProperty('--text-primary', '#323233')
      root.style.setProperty('--text-secondary', '#969799')
      root.style.setProperty('--background-primary', '#f7f8fa')
      root.style.setProperty('--background-secondary', '#ffffff')
      root.style.setProperty('--border-color', '#ebedf0')
    }
  }

  const currentTheme = computed(() => isDark.value ? 'dark' : 'light')

  return {
    isDark,
    currentTheme,
    toggleTheme,
    setTheme
  }
}