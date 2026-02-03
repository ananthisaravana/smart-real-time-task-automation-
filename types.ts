
export enum TaskPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum TaskStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived'
}

export interface TaskTrigger {
  type: 'time' | 'location' | 'event' | 'activity';
  value: string;
}

export interface AutomationAction {
  type: 'notification' | 'email' | 'status_update' | 'webhook';
  payload: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  basePriority: TaskPriority;
  dynamicPriority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  triggers: TaskTrigger[];
  automations: AutomationAction[];
  contextReason?: string;
  createdAt: string;
}

export interface WorldState {
  currentTime: string;
  currentLocation: string;
  userActivity: 'working' | 'driving' | 'resting' | 'exercising';
  energyLevel: number; // 0-100
  upcomingMeetings: string[];
}
