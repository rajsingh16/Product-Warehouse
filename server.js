import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
