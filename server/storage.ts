export interface IStorage {
  getHealth(): Promise<string>;
}

export class MemStorage implements IStorage {
  async getHealth(): Promise<string> {
    return "ok";
  }
}

export const storage = new MemStorage();
