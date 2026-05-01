import { UserRole } from "./types";

export const MOCK_USERS = [
  { id: '1', name: 'GTask Admin', email: 'admin@gtask.com', role: UserRole.ADMIN, createdAt: Date.now() },
  { id: '2', name: 'Supervisor Técnico', email: 'supervisor@gtask.com', role: UserRole.SUPERVISOR, createdAt: Date.now() },
  { id: '3', name: 'Técnico Externo 01', email: 'tecnico@gtask.com', role: UserRole.TECHNICIAN, createdAt: Date.now() },
  { id: '4', name: 'Técnico Interno 02', email: 'interno@gtask.com', role: UserRole.TECHNICIAN, createdAt: Date.now() },
];

export const MOCK_CHECKLISTS = [
  {
    id: 'c1',
    title: 'Manutenção Preventiva de Impressoras',
    description: 'Verificação periódica de cilindros, fusão e limpeza interna',
    category: 'Oficina Técnica',
    items: [
      { id: 'i1', title: 'Verificar rolo pressor da fusão', required: true },
      { id: 'i2', title: 'Limpeza do scaner (vidro)', required: true },
      { id: 'i3', title: 'Teste de impressão de cores', required: true },
      { id: 'i4', title: 'Limpeza do tracionador de papel', required: true },
    ]
  },
  {
    id: 'c2',
    title: 'Checklist de Veículo (Rota)',
    description: 'Verificação diária de segurança para saída de campo',
    category: 'Logística',
    items: [
      { id: 'i5', title: 'Nível de óleo e água', required: true },
      { id: 'i6', title: 'Calibragem de pneus', required: true },
      { id: 'i7', title: 'Limpeza interna do veículo', required: false },
    ]
  },
  {
    id: 'c3',
    title: 'Conferência de Estoque (Ricoh/Zebra)',
    description: 'Balanço diário de toners e etiquetas',
    category: 'Estoque',
    items: [
      { id: 'i8', title: 'Contagem de toners 2550', required: true },
      { id: 'i9', title: 'Contagem de fitas Ribbon Zebra', required: true },
    ]
  }
];

export const MOCK_ASSIGNMENTS = [
  {
    id: 'a1',
    checklistId: 'c1',
    checklistTitle: 'Manutenção Ricoh MP 301',
    assignedTo: '3',
    assignedToName: 'Técnico Externo 01',
    assignedBy: '2',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0],
    scheduledAt: Date.now(),
    itemsStatus: {}
  },
  {
    id: 'a2',
    checklistId: 'c2',
    checklistTitle: 'Rota Veículo ABC-1234',
    assignedTo: '4',
    assignedToName: 'Técnico Interno 02',
    assignedBy: '2',
    status: 'in_service',
    dueDate: new Date().toISOString().split('T')[0],
    scheduledAt: Date.now(),
    itemsStatus: {
      'i5': { completed: true, timestamp: Date.now() }
    }
  }
];
