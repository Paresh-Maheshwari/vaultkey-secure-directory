export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSensitive: boolean; // e.g., for banking info, hides by default
}

export interface LabeledValue {
  id: string;
  label: string; // 'Mobile', 'Work', 'Home', 'Main', 'Other'
  value: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  photo?: string; // Base64 string
  emails: LabeledValue[];
  phones: LabeledValue[];
  position?: string;
  department?: string;
  company?: string;
  address?: string;
  website?: string;
  birthday?: string;
  notes?: string;
  customFields: CustomField[];
  createdAt: string;
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST'
}