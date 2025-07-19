export interface User {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'authority';
  address?: string;
  phone?: string;
}

export interface Bin {
  id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'general' | 'recycling' | 'organic';
  status: 'empty' | 'half-full' | 'full' | 'overflowing';
  lastEmptied: string;
  nextPickup: string;
  reportedIssues?: string[];
}

export interface PickupRequest {
  id: string;
  userId: string;
  binId: string;
  requestedDate: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  binId: string;
  userId: string;
  type: 'overflow' | 'damage' | 'maintenance';
  description: string;
  imageUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

export interface RecyclingStats {
  userId: string;
  period: 'weekly' | 'monthly' | 'yearly';
  plasticWeight: number;
  paperWeight: number;
  glassWeight: number;
  metalWeight: number;
  totalWeight: number;
  co2Saved: number;
}