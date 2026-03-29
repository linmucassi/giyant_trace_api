// Default industry templates to seed the database

export const defaultTemplates = [
  {
    name: 'Auto Repair',
    industry: 'auto_repair' as const,
    description: 'Standard stages for vehicle repair workshops',
    stages: [
      { name: 'Vehicle Received', order: 1, expectedDurationHours: 1, color: '#6366F1', icon: 'car' },
      { name: 'Diagnosing / Inspecting', order: 2, expectedDurationHours: 4, color: '#F59E0B', icon: 'search' },
      { name: 'Quote Sent / Awaiting Approval', order: 3, expectedDurationHours: 24, color: '#8B5CF6', icon: 'file-text' },
      { name: 'Parts Ordered', order: 4, expectedDurationHours: 48, color: '#EC4899', icon: 'package' },
      { name: 'Repair In Progress', order: 5, expectedDurationHours: 8, color: '#3B82F6', icon: 'wrench' },
      { name: 'Quality Check', order: 6, expectedDurationHours: 2, color: '#14B8A6', icon: 'check-circle' },
      { name: 'Ready for Collection', order: 7, expectedDurationHours: 0, color: '#22C55E', icon: 'check' },
      { name: 'Collected / Completed', order: 8, expectedDurationHours: 0, color: '#10B981', icon: 'flag' },
    ],
  },
  {
    name: 'Phone / Electronics Repair',
    industry: 'electronics_repair' as const,
    description: 'Standard stages for electronics and phone repair',
    stages: [
      { name: 'Device Received', order: 1, expectedDurationHours: 1, color: '#6366F1', icon: 'smartphone' },
      { name: 'Diagnosing', order: 2, expectedDurationHours: 2, color: '#F59E0B', icon: 'search' },
      { name: 'Quote Sent', order: 3, expectedDurationHours: 4, color: '#8B5CF6', icon: 'file-text' },
      { name: 'Parts / Components Ordered', order: 4, expectedDurationHours: 72, color: '#EC4899', icon: 'package' },
      { name: 'Repair In Progress', order: 5, expectedDurationHours: 4, color: '#3B82F6', icon: 'tool' },
      { name: 'Testing', order: 6, expectedDurationHours: 1, color: '#14B8A6', icon: 'zap' },
      { name: 'Ready for Collection', order: 7, expectedDurationHours: 0, color: '#22C55E', icon: 'check' },
    ],
  },
  {
    name: 'Delivery / Logistics',
    industry: 'logistics' as const,
    description: 'Stages for parcel and logistics tracking',
    stages: [
      { name: 'Order Received', order: 1, expectedDurationHours: 1, color: '#6366F1', icon: 'inbox' },
      { name: 'Processing', order: 2, expectedDurationHours: 4, color: '#F59E0B', icon: 'package' },
      { name: 'Dispatched', order: 3, expectedDurationHours: 2, color: '#3B82F6', icon: 'truck' },
      { name: 'In Transit', order: 4, expectedDurationHours: 24, color: '#8B5CF6', icon: 'map-pin' },
      { name: 'Out for Delivery', order: 5, expectedDurationHours: 4, color: '#F59E0B', icon: 'navigation' },
      { name: 'Delivered', order: 6, expectedDurationHours: 0, color: '#22C55E', icon: 'check-circle' },
    ],
  },
  {
    name: 'Home Services',
    industry: 'home_services' as const,
    description: 'For plumbers, electricians, and home service providers',
    stages: [
      { name: 'Booking Confirmed', order: 1, expectedDurationHours: 1, color: '#6366F1', icon: 'calendar' },
      { name: 'En Route', order: 2, expectedDurationHours: 1, color: '#F59E0B', icon: 'navigation' },
      { name: 'On Site / Assessing', order: 3, expectedDurationHours: 1, color: '#8B5CF6', icon: 'home' },
      { name: 'Work In Progress', order: 4, expectedDurationHours: 4, color: '#3B82F6', icon: 'tool' },
      { name: 'Completed', order: 5, expectedDurationHours: 0, color: '#22C55E', icon: 'check-circle' },
    ],
  },
]
