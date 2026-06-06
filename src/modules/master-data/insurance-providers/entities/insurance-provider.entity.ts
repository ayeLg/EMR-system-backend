export interface InsuranceProviderRecord {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  isActive: boolean;
}
