require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./api/utils/db");

const PORT = process.env.PORT || 3000;

// Connect to the database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
