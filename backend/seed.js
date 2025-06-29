// seed.js
import connectionDB from "./Database/db.config.js";
import { seedAdmin } from "./Controllers/UserController.js";

const runSeeder = async () => {
  await connectionDB();
  await seedAdmin();
  console.log(" Admin created ,if not already exists");
  process.exit();
};

runSeeder();
