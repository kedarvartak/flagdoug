export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}
