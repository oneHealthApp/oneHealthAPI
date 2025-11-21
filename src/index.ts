import app from './app';
import { getPrisma } from './prisma';
import { logRoutes } from './utils';


const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL


async function startServer() {
  try {
   // await getPrisma(); // connect to RDS before starting server

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT} ${DATABASE_URL}`);
      logRoutes(app);
    });
  } catch (err) {
    console.error('❌ Could not start server:', err);
    process.exit(1);
  }
}

startServer();
