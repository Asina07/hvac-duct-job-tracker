import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

//ssl? — Supabase requires a secure connection. Without this line your connection will be rejected.

dbPool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error(" DB Connection failed:", err.message);
  } else {
    console.log(" DB Connected at:", res.rows[0]);
  }
});

export default dbPool;
