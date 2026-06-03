export class __Feature__ {
  [key: string]: unknown;

  id: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<__Feature__> & Record<string, unknown>) {
    Object.assign(this, partial);
  }
}
