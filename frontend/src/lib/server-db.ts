import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool(): Pool {
	if (!pool) {
		const connectionString =
			process.env.DATABASE_URL ||
			"postgresql://aurabook_user:aurabook_secure_password@localhost:5432/aurabook_db";
		pool = new Pool({
			connectionString,
			max: 10,
			idleTimeoutMillis: 30000,
		});
	}
	return pool;
}

export async function queryDb<T = any>(text: string, params?: any[]): Promise<T[]> {
	const p = getDbPool();
	const res = await p.query(text, params);
	return res.rows;
}
