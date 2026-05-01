export enum UserRole {
  ADMIN = 'admin',
  COORDINATOR = 'coordenador',
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'Técnico',
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

export enum AssignmentStatus {
  PENDING = 'Pendente',
  IN_SERVICE = 'in_service',
  WAITING_PART = 'waiting_part',
  COMPLETED = 'Concluida',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  category: string;
  items: ChecklistItem[];
  createdBy: string;
  createdAt: number;
}

export interface Assignment {
  id: string;
  checklistId: string;
  checklistTitle: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  status: AssignmentStatus;
  dueDate: number;
  scheduledAt: number;
  completedAt?: number;
  itemsStatus: Record<string, {
    completed: boolean;
    photos?: string[];
    notes?: string[];
    timestamp?: number;
  }>;
  supervisorFeedback?: string;
  supervisorId?: string;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  completedTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  period: string; // e.g., '2026-04'
}
