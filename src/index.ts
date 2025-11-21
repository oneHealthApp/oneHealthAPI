import app from "./app";
import { logRoutes } from "./utils";
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  logRoutes(app);
});
