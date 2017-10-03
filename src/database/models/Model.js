type BookshelfTransaction = any

export interface Model<M = any> {
  +id: number;

  static fetchById (id: number): Promise<this>;
  static fetchSingle (...query: Array<any>): Promise<this>;
  static fetchAll (...query: Array<any>): Promise<Array<this>>;

  // Model#create omitted - may have a different interface.

  update (fields: M, transaction: ?BookshelfTransaction): Promise<this>;

  toJSON (): M;
  materialize (): Promise<M>;
}
