import sql from "mssql";

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    const config = {
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      options: { encrypt: true, trustServerCertificate: false }
    };
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}


