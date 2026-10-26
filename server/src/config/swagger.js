const swaggerJSDoc = require("swagger-jsdoc")
const env = require("./env")

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "DishaYaaN REST API",
    version: "1.0.0",
    description: "Production REST API Backend for DishaYaaN Class 6-12 Mentorship Platform",
    contact: {
      name: "DishaYaaN Engineering",
      email: "ops@dishayaan.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token or Supabase access token.",
      },
    },
  },
}

const path = require("path")

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, "../routes/*.js"), path.join(__dirname, "../../index.js")],
}

const swaggerSpec = swaggerJSDoc(options)

module.exports = swaggerSpec
