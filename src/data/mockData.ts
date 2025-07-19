import { Bin, PickupRequest, Report, RecyclingStats } from '../types';

export const mockBins: Bin[] = [
  {
    id: '1',
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: '123 Main St, New York, NY'
    },
    type: 'general',
    status: 'half-full',
    lastEmptied: '2024-01-15',
    nextPickup: '2024-01-22'
  },
  {
    id: '2',
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: '456 Park Ave, New York, NY'
    },
    type: 'recycling',
    status: 'overflowing',
    lastEmptied: '2024-01-10',
    nextPickup: '2024-01-18',
    reportedIssues: ['Overflowing', 'Needs immediate attention']
  },
  {
    id: '3',
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: '789 Broadway, New York, NY'
    },
    type: 'organic',
    status: 'empty',
    lastEmptied: '2024-01-16',
    nextPickup: '2024-01-23'
  }
];

export const mockPickupRequests: PickupRequest[] = [
  {
    id: '1',
    userId: '1',
    binId: '1',
    requestedDate: '2024-01-20',
    status: 'pending',
    priority: 'medium',
    notes: 'Regular scheduled pickup',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    userId: '1',
    binId: '2',
    requestedDate: '2024-01-18',
    status: 'scheduled',
    priority: 'high',
    notes: 'Urgent - bin overflowing',
    createdAt: '2024-01-16'
  }
];

export const mockReports: Report[] = [
  {
    id: '1',
    binId: '2',
    userId: '1',
    type: 'overflow',
    description: 'Bin is overflowing and attracting pests',
    location: {
      lat: 40.7589,
      lng: -73.9851
    },
    status: 'open',
    createdAt: '2024-01-16'
  }
];

export const mockRecyclingStats: RecyclingStats = {
  userId: '1',
  period: 'monthly',
  plasticWeight: 12.5,
  paperWeight: 8.3,
  glassWeight: 5.7,
  metalWeight: 3.2,
  totalWeight: 29.7,
  co2Saved: 15.4
};