# Plano de Remoção de Tons Escuros - Nyvlo Omnichannel

## Objetivo
Remover todos os tons escuros (bg-slate-900, bg-slate-950, bg-black) e substituir por tons claros mantendo a hierarquia visual e profissionalismo.

## Mapeamento de Substituições

### Botões de Ação Primária
- `bg-slate-900` → `bg-emerald-500`
- `hover:bg-black` → `hover:bg-emerald-600`
- `shadow-slate-900/XX` → `shadow-emerald-500/XX`

### Fundos de Modal/Overlay
- `bg-slate-950/60` → `bg-slate-900/20` (overlay mais sutil)
- `bg-slate-950/95` → `bg-white/95` (fundo de modal)

### Cards e Containers Escuros
- `bg-slate-900` → `bg-white` (com border-slate-200)
- `text-white` → `text-slate-900` (quando fundo mudar)

### Inputs e Campos
- `bg-slate-950/50` → `bg-slate-50`
- `border-white/5` → `border-slate-200`
- `text-white` → `text-slate-900`
- `placeholder:text-slate-600` → `placeholder:text-slate-400`

## Arquivos a Modificar

### Componentes de Chat (Prioridade Alta)
1. ✅ MessageInput.tsx - Parcialmente concluído
2. MessageArea.tsx
3. ConversationSidebar.tsx
4. ForwardModal.tsx
5. QuickMessagesManager.tsx
6. ContactInfo.tsx
7. MediaUpload.tsx
8. AudioRecorder.tsx

### Páginas (Prioridade Média)
1. LoginPage.tsx - Manter escuro (é o design premium que o usuário gostou)
2. DashboardPage.tsx
3. ChatPage.tsx
4. InstancesPage.tsx

### Componentes Auxiliares (Prioridade Baixa)
1. LabelManager.tsx
2. ContactCRM.tsx
3. AudioPlayer.tsx
4. RatingForm.tsx

## Status
- Em progresso: MessageInput.tsx (2/3 substituições)
- Pendente: 31 ocorrências restantes
