import { useState } from 'react'
import { useSettingsStore, Theme } from '../../store/settingsStore'
import Logo from '../common/Logo'
import './SettingsPanel.css'

interface SettingsPanelProps {
  onClose: () => void
}

type SettingsTab = 'general' | 'notifications' | 'privacy' | 'about'

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const settings = useSettingsStore()

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>Aparência</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Tema</span>
          <span className="setting-description">Escolha o tema da interface</span>
        </div>
        <select
          value={settings.theme}
          onChange={(e) => settings.setTheme(e.target.value as Theme)}
          className="setting-select"
        >
          <option value="dark">Escuro</option>
          <option value="light">Claro</option>
          <option value="system">Sistema</option>
        </select>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Tamanho da fonte</span>
          <span className="setting-description">Ajuste o tamanho do texto</span>
        </div>
        <select
          value={settings.fontSize}
          onChange={(e) => settings.setFontSize(e.target.value as 'small' | 'medium' | 'large')}
          className="setting-select"
        >
          <option value="small">Pequeno</option>
          <option value="medium">Médio</option>
          <option value="large">Grande</option>
        </select>
      </div>

      <h3>Mensagens</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Enter para enviar</span>
          <span className="setting-description">Pressione Enter para enviar mensagens</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.enterToSend}
            onChange={(e) => settings.setEnterToSend(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Download automático de mídia</span>
          <span className="setting-description">Baixar fotos e vídeos automaticamente</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.mediaAutoDownload}
            onChange={(e) => settings.setMediaAutoDownload(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notificações</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Notificações</span>
          <span className="setting-description">Receber notificações de novas mensagens</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notifications.enabled}
            onChange={(e) => settings.setNotifications({ enabled: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Som</span>
          <span className="setting-description">Tocar som ao receber mensagens</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notifications.sound}
            onChange={(e) => settings.setNotifications({ sound: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {settings.notifications.sound && (
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Volume do som</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.notifications.soundVolume}
            onChange={(e) => settings.setNotifications({ soundVolume: parseFloat(e.target.value) })}
            className="setting-range"
          />
        </div>
      )}

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Mostrar prévia</span>
          <span className="setting-description">Exibir conteúdo da mensagem na notificação</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notifications.showPreview}
            onChange={(e) => settings.setNotifications({ showPreview: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Notificações do desktop</span>
          <span className="setting-description">Mostrar notificações do sistema</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notifications.desktopNotifications}
            onChange={(e) => settings.setNotifications({ desktopNotifications: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="settings-section">
      <h3>Privacidade</h3>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Mostrar status online</span>
          <span className="setting-description">Permitir que outros vejam quando você está online</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.privacy.showOnlineStatus}
            onChange={(e) => settings.setPrivacy({ showOnlineStatus: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Confirmação de leitura</span>
          <span className="setting-description">Enviar confirmação quando ler mensagens</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.privacy.showReadReceipts}
            onChange={(e) => settings.setPrivacy({ showReadReceipts: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <span className="setting-label">Indicador de digitação</span>
          <span className="setting-description">Mostrar quando você está digitando</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.privacy.showTypingIndicator}
            onChange={(e) => settings.setPrivacy({ showTypingIndicator: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  )

  const renderAbout = () => (
    <div className="settings-section about-section">
      <div className="about-logo">
        <Logo size={120} animated={false} />
      </div>
      <h2>Nyvlo Omnichannel</h2>
      <p className="version">Versão 1.0.0</p>
      <p className="description">
        Interface web completa para gerenciamento Omnichannel e WhatsApp Business.
        Envie e receba mensagens, gerencie múltiplas instâncias e automatize seu atendimento.
      </p>
      <div className="about-links">
        <a href="#" className="about-link">Termos de Uso</a>
        <a href="#" className="about-link">Política de Privacidade</a>
        <a href="#" className="about-link">Suporte</a>
      </div>
      <button className="reset-btn" onClick={settings.resetSettings}>
        Restaurar configurações padrão
      </button>
    </div>
  )

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <button className="back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h2>Configurações</h2>
        </div>

        <div className="settings-content">
          <div className="settings-tabs">
            <button
              className={`tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              Geral
            </button>
            <button
              className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              Notificações
            </button>
            <button
              className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
              Privacidade
            </button>
            <button
              className={`tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              Sobre
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'privacy' && renderPrivacySettings()}
            {activeTab === 'about' && renderAbout()}
          </div>
        </div>
      </div>
    </div>
  )
}
