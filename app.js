require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require('express-rate-limit');
const routes = require("./api/routes");

const app = express();

// Basic Rate Limiter: 100 requests per 15 minutes for each IP
const limiter = rateLimit({
    windowMs: process.env.WINDOW_MS * 60 * 1000, // 15 minutes
    max: process.env.REQ_LIMIT, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    message: {
        error: 'Too many notes created from this IP, please try again later.',
      },
  });
  
  // Apply to all requests
  app.use(limiter);


// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// Routes
app.use("/", routes);

module.exports = app;
