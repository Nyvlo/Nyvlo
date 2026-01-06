import { useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleEmojiSelect = (emoji: { native: string }) => {
    onSelect(emoji.native)
  }

  return (
    <div className="relative z-[60] shadow-2xl rounded-[32px] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200" ref={pickerRef}>
      <Picker
        data={data}
        onEmojiSelect={handleEmojiSelect}
        locale="pt"
        theme="light"
        previewPosition="none"
        skinTonePosition="search"
        searchPosition="sticky"
        navPosition="bottom"
        perLine={8}
        emojiSize={24}
        emojiButtonSize={32}
        maxFrequentRows={2}
        categories={[
          'frequent',
          'people',
          'nature',
          'foods',
          'activity',
          'places',
          'objects',
          'symbols',
          'flags'
        ]}
        i18n={{
          search: 'Pesquisar',
          search_no_results_1: 'Nenhum emoji encontrado',
          search_no_results_2: 'Tente outra pesquisa',
          pick: 'Escolha um emoji...',
          add_custom: 'Adicionar emoji personalizado',
          categories: {
            activity: 'Atividades',
            custom: 'Personalizado',
            flags: 'Bandeiras',
            foods: 'Comida e bebida',
            frequent: 'Usados frequentemente',
            nature: 'Animais e natureza',
            objects: 'Objetos',
            people: 'Pessoas',
            places: 'Viagens e lugares',
            search: 'Resultados da pesquisa',
            symbols: 'Símbolos'
          },
          skins: {
            choose: 'Escolha o tom de pele',
            1: 'Padrão',
            2: 'Claro',
            3: 'Médio claro',
            4: 'Médio',
            5: 'Médio escuro',
            6: 'Escuro'
          }
        }}
      />
    </div>
  )
}
