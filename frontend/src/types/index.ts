import type { ReactNode } from "react";

export type UserRole = "candidate" | "recruiter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship" | "remote";
  salary?: string;
  description: string;
  postedAt: string;
  recruiterId: string;
}

export type CVStatus = "pending" | "processing" | "completed" | "error";

export interface CV {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  status: CVStatus;
  createdAt: string;
}

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected";

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  cvId: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt?: string;
  jobTitle?: string;
  companyName?: string;
  // recruiter view
  candidateName?: string;
  candidateEmail?: string;
  filePath?: string;
  cvFileName?: string;
}

export interface Bookmark {
  bookmarkId: string;
  savedAt: string;
  jobId: string;
  title: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  companyName: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  website?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}
