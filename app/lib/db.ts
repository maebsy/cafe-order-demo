// 데모용 DB 연결 자리 (실제 연결 없음)
type Row = Record<string, unknown>;

export const db = {
  async query(sql: string): Promise<Row[]> {
    console.log("query", sql);
    return [];
  },
  orders: {
    async create({ data }: { data: Row }): Promise<Row> {
      return { id: Date.now(), ...data };
    },
  },
};
