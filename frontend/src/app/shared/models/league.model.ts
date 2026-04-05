export type LeagueRole = 'ADMIN' | 'MEMBER' | 'PENDING';

export interface LeagueMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending';
}

export interface League {
  id: string;
  slug: string;
  name: string;
  tournament: string;
  predictionType: string;
  timeframeRule: string;
  inviteLink: string;
  members: LeagueMember[];
  isOwner: boolean;
}

export interface LeagueWithMembership {
  slug: string;
  name: string;
  tournament: string;
  memberCount: number;
  role: LeagueRole;
}
