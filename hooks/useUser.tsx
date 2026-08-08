"use client";

import * as React from "react";

export interface ClientUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  image?: string | null;
  role: string;
  credits: number;
  rating: number;
  totalReviews: number;
  verified: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  onboardingComplete: boolean;
}

const UserContext = React.createContext<ClientUser | null>(null);

export function UserProvider({ user, children }: { user: ClientUser | null; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): ClientUser | null {
  return React.useContext(UserContext);
}
