// Notification Service for browser notifications and sounds

class NotificationService {
  private permission: NotificationPermission = 'default'
  private soundEnabled: boolean = true
  private notificationSound: HTMLAudioElement | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Check notification permission
    if ('Notification' in window) {
      this.permission = Notification.permission
    }

    // Create notification sound
    this.notificationSound = new Audio('/notification.mp3')
    this.notificationSound.volume = 0.5

    // Load settings from localStorage
    const settings = localStorage.getItem('notification_settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      this.soundEnabled = parsed.soundEnabled ?? true
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      return false
    }

    const result = await Notification.requestPermission()
    this.permission = result
    return result === 'granted'
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    // Don't show if page is visible
    if (document.visibilityState === 'visible') {
      return
    }

    // Request permission if needed
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    // Play sound
    if (this.soundEnabled && this.notificationSound) {
      try {
        this.notificationSound.currentTime = 0
        await this.notificationSound.play()
      } catch (e) {
        // Ignore audio play errors (user interaction required)
      }
    }

    // Show notification
    const notification = new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'nyvlo-message',
      ...options
    })

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000)

    // Focus window on click
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  showMessageNotification(senderName: string, message: string, profilePicture?: string): void {
    this.showNotification(senderName, {
      body: message,
      icon: profilePicture || '/favicon.svg'
    })
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    this.saveSettings()
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  private saveSettings(): void {
    localStorage.setItem('notification_settings', JSON.stringify({
      soundEnabled: this.soundEnabled
    }))
  }

  // Update page title with unread count
  updateBadge(count: number): void {
    const baseTitle = 'Nyvlo Omnichannel'
    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`
    } else {
      document.title = baseTitle
    }
  }
}

export const notificationService = new NotificationService()
