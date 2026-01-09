import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import { MediaUploadResult, conversationsApi } from '../services/api'
import { notificationService } from '../services/notification-service'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker'
  content: string
  mediaUrl?: string
  thumbnailUrl?: string
  fileName?: string
  fileSize?: number
  replyTo?: string
  isForwarded?: boolean
  status: {
    sent: boolean
    delivered: boolean
    read: boolean
  }
  timestamp: Date
  isFromMe: boolean
  isStarred?: boolean
  phoneNumber?: string
  whatsappMessageId?: string
  whatsappChatId?: string
  instanceId?: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface QuickMessage {
  id: string
  shortcut: string
  title: string
  content: string
  variables: string[]
}

export interface Conversation {
  id: string
  type: 'individual' | 'group'
  name: string
  phoneNumber?: string
  profilePicture?: string
  lastMessage?: Message
  unreadCount: number
  isArchived: boolean
  isPinned: boolean
  isTyping?: boolean
  isOnline?: boolean
  labels: Label[]
  updatedAt: Date
}



interface ChatState {
  instanceId: string | null
  socket: Socket | null
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Record<string, Message[]>
  searchQuery: string
  isLoading: boolean
  typingUsers: Record<string, boolean>
  quickMessages: QuickMessage[]
  labels: Label[]
  replyTo: Message | null

  // Actions
  setInstanceId: (id: string) => void
  connectSocket: (token: string) => void
  disconnectSocket: () => void
  loadConversations: () => Promise<void>
  selectConversation: (conversation: Conversation | null) => void
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (content: string, type?: string, mediaUrl?: string, replyTo?: string, isInternal?: boolean) => Promise<void>
  sendMediaMessage: (media: MediaUploadResult, caption?: string) => Promise<void>
  sendAudioMessage: (mediaId: string, duration: number) => Promise<void>
  setSearchQuery: (query: string) => void
  markAsRead: (conversationId: string) => void
  startTyping: () => void
  stopTyping: () => void
  archiveConversation: (conversationId: string, archived: boolean) => Promise<void>
  pinConversation: (conversationId: string, pinned: boolean) => Promise<void>
  forwardMessage: (messageId: string, conversationIds: string[]) => Promise<void>
  addQuickMessage: (message: QuickMessage) => Promise<void>
  updateQuickMessage: (id: string, updates: Partial<QuickMessage>) => Promise<void>
  deleteQuickMessage: (id: string) => Promise<void>
  loadQuickMessages: () => Promise<void>
  loadLabels: () => Promise<void>
  updateConversationLabels: (conversationId: string, labelIds: string[]) => Promise<void>
  closeConversation: (conversationId: string) => void
  toggleStarMessage: (messageId: string, starred: boolean) => Promise<void>
  setReplyTo: (message: Message | null) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  instanceId: null,
  socket: null,
  conversations: [],
  selectedConversation: null,
  messages: {},
  searchQuery: '',
  isLoading: false,
  typingUsers: {},
  quickMessages: [],
  labels: [],
  replyTo: null,

  setInstanceId: (id) => set({ instanceId: id }),

  connectSocket: (token) => {
    const { socket: existingSocket } = get()

    if (existingSocket?.connected) {
      return
    }

    if (existingSocket) {
      existingSocket.disconnect()
    }

    const socket = io('/', {
      auth: { token },
      query: { instanceId: get().instanceId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('Socket conectado')
      get().loadConversations()
      get().loadQuickMessages()
      get().loadLabels()
    })

    socket.on('message:new', (message: Message) => {
      const { messages, conversations, selectedConversation } = get()
      const convId = message.conversationId

      // Add message to list
      const convMessages = messages[convId] || []
      set({
        messages: {
          ...messages,
          [convId]: [...convMessages, message],
        },
      })

      // Check if conversation exists
      const convExists = conversations.some(c => c.id === convId)
      if (!convExists) {
        // If it's a new conversation, reload the list to get all details
        get().loadConversations()
        return
      }

      // Update existing conversation
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === convId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: selectedConversation?.id === convId ? 0 : conv.unreadCount + 1,
            updatedAt: new Date(),
          }
        }
        return conv
      })

      // Sort by last message
      updatedConversations.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

      set({ conversations: updatedConversations })

      // Show notification for incoming messages
      if (!message.isFromMe && selectedConversation?.id !== convId) {
        const conv = conversations.find(c => c.id === convId)
        const senderName = conv?.name || message.senderName || 'Nova mensagem'
        const messagePreview = message.type === 'text'
          ? message.content
          : message.type === 'image' ? '📷 Imagem'
            : message.type === 'video' ? '🎥 Vídeo'
              : message.type === 'audio' ? '🎵 Áudio'
                : message.type === 'document' ? '📄 Documento'
                  : 'Nova mensagem'

        notificationService.showMessageNotification(senderName, messagePreview, conv?.profilePicture)
      }

      // Update badge
      const totalUnread = updatedConversations.reduce((sum, c) => sum + c.unreadCount, 0)
      notificationService.updateBadge(totalUnread)
    })

    socket.on('message:status', (data: { messageId: string; status: Message['status'] }) => {
      const { messages } = get()
      const updatedMessages: Record<string, Message[]> = {}

      Object.entries(messages).forEach(([convId, msgs]) => {
        updatedMessages[convId] = msgs.map((msg) =>
          msg.id === data.messageId ? { ...msg, status: data.status } : msg
        )
      })

      set({ messages: updatedMessages })
    })

    socket.on('conversation:typing', (data: { conversationId: string; isTyping: boolean }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [data.conversationId]: data.isTyping,
        },
      }))
    })

    set({ socket })
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null })
    }
  },

  loadConversations: async () => {
    const { instanceId } = get()
    if (!instanceId) return

    set({ isLoading: true })
    try {
      const response = await conversationsApi.list(instanceId)
      if (response.success && response.data) {
        set({ conversations: response.data.conversations || [] })
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  selectConversation: (conversation) => {
    set({ selectedConversation: conversation })
    if (conversation) {
      get().loadMessages(conversation.id)
      get().markAsRead(conversation.id)
    }
  },

  loadMessages: async (conversationId) => {
    const { instanceId, messages } = get()
    if (!instanceId) return

    // Check if already loaded
    if (messages[conversationId]?.length > 0) return

    try {
      const response = await conversationsApi.getMessages(instanceId, conversationId)
      if (response.success && response.data) {
        set({
          messages: {
            ...messages,
            [conversationId]: response.data.messages || [],
          },
        })
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  },

  sendMessage: async (content, type = 'text', mediaUrl, replyTo, isInternal) => {
    const { socket, selectedConversation, instanceId } = get()
    if (!socket || !selectedConversation || !instanceId) return

    const messageData = {
      instanceId,
      conversationId: selectedConversation.id,
      type,
      content,
      mediaUrl,
      replyTo,
      isInternal: !!isInternal,
    }

    socket.emit('message:send', messageData)
  },

  sendMediaMessage: async (media, caption) => {
    const { socket, selectedConversation, instanceId } = get()
    if (!socket || !selectedConversation || !instanceId) return

    // Determine type from mimetype
    let type: 'image' | 'video' | 'audio' | 'document' = 'document'
    if (media.mimetype.startsWith('image/')) type = 'image'
    else if (media.mimetype.startsWith('video/')) type = 'video'
    else if (media.mimetype.startsWith('audio/')) type = 'audio'

    const messageData = {
      instanceId,
      conversationId: selectedConversation.id,
      type,
      content: caption || media.originalName,
      mediaId: media.id,
      mediaUrl: media.url,
      thumbnailUrl: media.thumbnailUrl,
      fileName: media.originalName,
      fileSize: media.size,
    }

    socket.emit('message:send', messageData)
  },

  sendAudioMessage: async (mediaId, duration) => {
    const { socket, selectedConversation, instanceId } = get()
    if (!socket || !selectedConversation || !instanceId) return

    const messageData = {
      instanceId,
      conversationId: selectedConversation.id,
      type: 'audio',
      content: `Áudio (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      mediaId,
      mediaUrl: `/api/media/${mediaId}`,
      duration,
    }

    socket.emit('message:send', messageData)
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  markAsRead: (conversationId) => {
    const { socket, conversations } = get()
    if (socket) {
      socket.emit('message:read', { conversationId })
    }

    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    )

    set({ conversations: updatedConversations })

    // Update badge
    const totalUnread = updatedConversations.reduce((sum, c) => sum + c.unreadCount, 0)
    notificationService.updateBadge(totalUnread)
  },

  startTyping: () => {
    const { socket, selectedConversation } = get()
    if (socket && selectedConversation) {
      socket.emit('typing:start', { conversationId: selectedConversation.id })
    }
  },

  stopTyping: () => {
    const { socket, selectedConversation } = get()
    if (socket && selectedConversation) {
      socket.emit('typing:stop', { conversationId: selectedConversation.id })
    }
  },

  archiveConversation: async (conversationId, archived) => {
    const { instanceId, conversations } = get()
    if (!instanceId) return

    try {
      const response = await conversationsApi.archive(instanceId, conversationId, archived)

      if (response.success) {
        const updatedConversations = conversations.map(conv =>
          conv.id === conversationId ? { ...conv, isArchived: archived } : conv
        )
        set({ conversations: updatedConversations })
      }
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error)
    }
  },

  pinConversation: async (conversationId, pinned) => {
    const { instanceId, conversations } = get()
    if (!instanceId) return

    try {
      const response = await conversationsApi.pin(instanceId, conversationId, pinned)

      if (response.success) {
        const updatedConversations = conversations.map(conv =>
          conv.id === conversationId ? { ...conv, isPinned: pinned } : conv
        )

        // Re-sort conversations
        updatedConversations.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })

        set({ conversations: updatedConversations })
      }
    } catch (error) {
      console.error('Erro ao fixar conversa:', error)
    }
  },

  forwardMessage: async (messageId, conversationIds) => {
    const { socket, instanceId, messages } = get()
    if (!socket || !instanceId) return

    // Find the original message
    let originalMessage: Message | undefined
    for (const convMessages of Object.values(messages)) {
      originalMessage = convMessages.find(m => m.id === messageId)
      if (originalMessage) break
    }

    if (!originalMessage) return

    // Forward to each conversation
    for (const convId of conversationIds) {
      const messageData = {
        instanceId,
        conversationId: convId,
        type: originalMessage.type,
        content: originalMessage.content,
        mediaUrl: originalMessage.mediaUrl,
        isForwarded: true,
      }

      socket.emit('message:send', messageData)
    }
  },

  addQuickMessage: async (message) => {
    const { quickMessagesApi } = await import('../services/api')
    const response = await quickMessagesApi.create(message)
    if (response.success) {
      get().loadQuickMessages()
    }
  },

  updateQuickMessage: async (id, updates) => {
    const { quickMessagesApi } = await import('../services/api')
    const response = await quickMessagesApi.update(id, updates)
    if (response.success) {
      get().loadQuickMessages()
    }
  },

  deleteQuickMessage: async (id) => {
    const { quickMessagesApi } = await import('../services/api')
    const response = await quickMessagesApi.delete(id)
    if (response.success) {
      get().loadQuickMessages()
    }
  },

  loadQuickMessages: async () => {
    const { quickMessagesApi } = await import('../services/api')
    const response = await quickMessagesApi.list()
    if (response.success && response.data) {
      set({ quickMessages: response.data.data })
    }
  },

  loadLabels: async () => {
    const { labelsApi } = await import('../services/api')
    const response = await labelsApi.list()
    if (response.success && response.data) {
      set({ labels: response.data.data })
    }
  },

  updateConversationLabels: async (conversationId, labelIds) => {
    const { instanceId, conversations, labels } = get()
    if (!instanceId) return
    const { conversationsApi } = await import('../services/api')
    const response = await conversationsApi.updateLabels(instanceId, conversationId, labelIds)
    if (response.success) {
      const newLabels = labels.filter(l => labelIds.includes(l.id))
      set({
        conversations: conversations.map(c =>
          c.id === conversationId ? { ...c, labels: newLabels } : c
        )
      })
    }
  },

  toggleStarMessage: async (messageId, starred) => {
    const { messages, selectedConversation, socket } = get()
    if (!selectedConversation) return

    // Immediately update local state
    const currentMessages = messages[selectedConversation.id] || []
    const updatedMessages = currentMessages.map(m =>
      m.id === messageId ? { ...m, isStarred: starred } : m
    )

    set((state) => ({
      messages: {
        ...state.messages,
        [selectedConversation.id]: updatedMessages
      }
    }))

    // Emit to socket (assuming implementation exists on backend or we add it later)
    // For now purely frontend or handled via message update
    if (socket) {
      socket.emit('message:star', { messageId, conversationId: selectedConversation.id, starred })
    }
  },

  setReplyTo: (message) => {
    set({ replyTo: message })
  },

  closeConversation: (conversationId) => {
    const { socket, instanceId } = get()
    if (socket && instanceId) {
      socket.emit('conversation:close', { conversationId, instanceId })
      // Optionally update local state to reflect closed status if needed
    }
  }
}))
