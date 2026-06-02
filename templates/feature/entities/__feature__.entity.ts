export class __Feature__ {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<__Feature__>) {
    Object.assign(this, partial);
  }
}
