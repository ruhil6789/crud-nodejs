import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

const getBaseUrl = (req: Request) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3002";
  return `${protocol}://${host}`;
};

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "CRUD API + Messaging",
    version: "1.0.0",
    description: "REST API with Users, Chats, Messages, and Attachments. Rate limited. Uses MongoDB, Redis.",
  },
  servers: [
    { url: "/", description: "Current server (auto-detected)" },
    { url: "http://localhost:3002", description: "Local" },
  ],
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Users", description: "User CRUD operations" },
    { name: "Chats", description: "Chat and message operations" },
    { name: "Attachments", description: "File upload" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "API status",
        responses: { 200: { description: "API running" } },
      },
    },
    "/metrics": {
      get: {
        tags: ["Health"],
        summary: "Prometheus metrics",
        description: "Returns metrics in Prometheus exposition format",
        responses: { 200: { description: "Metrics (text/plain)" } },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    status: { type: "string" },
                    uptime: { type: "number" },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users",
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/User" } },
                    cached: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  age: { type: "number", example: 30 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
          400: { description: "Validation error or duplicate email" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "User found", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
          404: { description: "User not found" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  age: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User updated" },
          404: { description: "User not found" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "User deleted" },
          404: { description: "User not found" },
        },
      },
    },
    "/api/chats": {
      get: {
        tags: ["Chats"],
        summary: "Get user's chats",
        parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "List of chats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Chat" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Chats"],
        summary: "Create chat",
        parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["participants"],
                properties: {
                  participants: { type: "array", items: { type: "string" }, example: ["userId1", "userId2"] },
                  name: { type: "string", example: "My Chat" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Chat created", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { chatId: { type: "string" } } } } } } } },
          400: { description: "Invalid input" },
        },
      },
    },
    "/api/chats/{id}": {
      get: {
        tags: ["Chats"],
        summary: "Get chat by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Chat found" },
          404: { description: "Chat not found" },
        },
      },
    },
    "/api/chats/{id}/messages": {
      get: {
        tags: ["Chats"],
        summary: "Get chat messages",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "before", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          200: {
            description: "List of messages",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Message" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/chats/{id}/participants": {
      put: {
        tags: ["Chats"],
        summary: "Add or remove participant",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "operation"],
                properties: {
                  userId: { type: "string" },
                  operation: { type: "string", enum: ["ADD", "REMOVE"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Participants updated" },
          400: { description: "Invalid operation" },
        },
      },
    },
    "/api/attachments": {
      post: {
        tags: ["Attachments"],
        summary: "Upload file",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "userId"],
                properties: {
                  file: { type: "string", format: "binary" },
                  userId: { type: "string" },
                  deviceId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "File uploaded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        attachmentId: { type: "string" },
                        url: { type: "string", description: "Relative path or S3 URL" },
                        fullUrl: { type: "string", description: "Direct URL (local uploads only)" },
                        viewUrl: { type: "string", description: "Use this URL to view file (presigned for S3, redirects for local)" },
                        mimeType: { type: "string" },
                        size: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "No file or userId" },
        },
      },
    },
    "/api/attachments/{id}/view": {
      get: {
        tags: ["Attachments"],
        summary: "View attachment",
        description: "Redirects to viewable URL. For S3: presigned URL. For local: direct URL.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          302: { description: "Redirect to file" },
          404: { description: "Attachment not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          age: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { $ref: "#/components/schemas/User" },
          cached: { type: "boolean" },
        },
      },
      Chat: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          participants: { type: "array", items: { type: "string" } },
          createdBy: { type: "string" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
      Message: {
        type: "object",
        properties: {
          _id: { type: "string" },
          chatId: { type: "string" },
          senderId: { type: "string" },
          content: { type: "string" },
          attachments: { type: "array", items: { type: "string" } },
          createdAt: { type: "string" },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express, basePath = "/api-docs"): void => {
  // JSON spec with dynamic server URL (uses request host so "Try it out" works on any server)
  app.get(`${basePath}.json`, (req: Request, res: Response) => {
    const doc = JSON.parse(JSON.stringify(swaggerDocument));
    doc.servers = [{ url: getBaseUrl(req), description: "This server" }];
    res.setHeader("Content-Type", "application/json");
    res.json(doc);
  });
  app.use(basePath, swaggerUi.serve, swaggerUi.setup(null, {
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: { url: `${basePath}.json` },
  }));
};
