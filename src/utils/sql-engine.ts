import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

let cachedSqlDir: string | null = null;
let cachedQueries: Record<string, string> = {};

/**
 * Find SQL directory in project
 */
const findSqlDirectory = async (): Promise<string> => {
  if (cachedSqlDir) return cachedSqlDir;

  const possiblePaths = [
    path.resolve(__dirname, './sql'), // Production build
    path.resolve(__dirname, '../../src/sql'), // Development
  ];

  for (const sqlPath of possiblePaths) {
    try {
      const stats = await fs.stat(sqlPath);
      if (stats.isDirectory()) {
        cachedSqlDir = sqlPath;
        logger.debug(`📁 SQL directory found at: ${sqlPath}`);
        return sqlPath;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    `SQL directory not found. Searched: ${possiblePaths.join(', ')}`,
  );
};

/**
 * Load all queries from all .sql files and cache them
 */
const cacheAllQueries = async (): Promise<void> => {
  if (Object.keys(cachedQueries).length > 0) return; // already cached

  const SQL_DIR = await findSqlDirectory();
  const files = await fs.readdir(SQL_DIR);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const fullPath = path.join(SQL_DIR, file);
    const content = await fs.readFile(fullPath, 'utf-8');

    // Match named query blocks: -- name: queryName
    const pattern = /--\s*name:\s*(\w+)\s*\r?\n([\s\S]*?)(?=--\s*name:|$)/gi;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      const query = match[2].trim().replace(/;\s*$/, '');
      cachedQueries[name] = query;
    }
  }
};

/**
 * Get a query by its reference name
 */
export async function loadQueryByName(refs: string): Promise<string> {
  // Initial cache load (no-op if already cached)
  await cacheAllQueries();

  if (!cachedQueries[refs]) {
    // If not found, force a refresh to pick up newly added/edited .sql files
    cachedQueries = {};
    await cacheAllQueries();
  }

  if (!cachedQueries[refs]) {
    throw new Error(`Query "${refs}" not found in any .sql file`);
  }

  return cachedQueries[refs];
}

/**
 * Replace {{param}} in SQL string with actual values
 */
export function substituteParams(
  sql: string,
  params: Record<string, any>,
): string {
  return sql.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    // Treat missing optional params as NULL to allow flexible SQL conditions
    const hasKey = Object.prototype.hasOwnProperty.call(params, key);
    const value = hasKey ? params[key] : null;

    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return value; // number or other types
  });
}

/**
 * List all cached queries
 */
export async function listAvailableQueries(): Promise<string[]> {
  await cacheAllQueries();
  return Object.keys(cachedQueries);
}
