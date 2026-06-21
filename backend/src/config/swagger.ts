import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Compliance & Risk Control Tower API",
      version: "1.0.0",
      description:
        "Unified API for managing compliance, risk, security governance, " +
        "project oversight, vendor governance, and executive dashboards.",
    },
    servers: [
      { url: "/api", description: "API base path" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            code: { type: "string" },
            details: { type: "object" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: { type: "object" } },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication & registration" },
      { name: "VEG", description: "Vendor Governance (VEG) requests" },
      { name: "Security", description: "Vulnerability & waiver management" },
      { name: "Projects", description: "Projects, roadmaps, SaaS, audits, committees" },
      { name: "Nexus", description: "Nexus IQ integration & risk scoring" },
      { name: "Dashboard", description: "Executive dashboard & KPIs" },
      { name: "Export", description: "CSV & PDF export" },
      { name: "Health", description: "Health check endpoint" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
