
import React from 'react';

export const INITIAL_TASKS = [
  {
    id: '1',
    title: 'Finalize quarterly report',
    description: 'Compile all department metrics for the Q3 presentation.',
    basePriority: 'High',
    dynamicPriority: 'High',
    status: 'Active',
    deadline: new Date(Date.now() + 120000).toISOString(), // 2 mins from now - TRIGGERS NOTIFICATION SOON
    triggers: [{ type: 'time', value: '09:00 AM' }],
    automations: [{ type: 'notification', payload: 'Report deadline approaching' }],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Client follow-up: Acme Corp',
    description: 'Call Sarah regarding the proposal feedback.',
    basePriority: 'Medium',
    dynamicPriority: 'Medium',
    status: 'Pending',
    deadline: new Date(Date.now() + 172800000).toISOString(),
    triggers: [{ type: 'event', value: 'CRM update' }],
    automations: [{ type: 'email', payload: 'sarah@acme.com' }],
    createdAt: new Date().toISOString()
  }
];

export const Icons = {
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Bot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899 15.343 2.657a1 1 0 0 1 1.607.815l-1.121 8.427a1 1 0 0 0 .991 1.132l5.122-.053a1 1 0 0 1 .839 1.543L11.44 26.772a1 1 0 0 1-1.638-.777l1.103-8.197a1 1 0 0 0-.986-1.132l-5.063.033a1 1 0 0 1-.856-1.8z"/></svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
  )
};
