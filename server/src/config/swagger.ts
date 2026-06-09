export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Sport Lounge API',
    version: '3.0.0',
    description: 'API Documentation for the Premium Sport Lounge Hookah & Tea Club',
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'phone'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Invalid input or user already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/mixes': {
      get: {
        summary: 'Get all mixes',
        tags: ['Mixes'],
        responses: {
          200: { description: 'List of all mixes' },
        },
      },
    },
    '/orders': {
      post: {
        summary: 'Create a new hookah order',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['liquid_id', 'seat_id', 'seat_label', 'seat_zone'],
                properties: {
                  mix_id: { type: 'string', nullable: true },
                  liquid_id: { type: 'string' },
                  notes: { type: 'string' },
                  seat_id: { type: 'string' },
                  seat_label: { type: 'string' },
                  seat_zone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order created' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/orders/{id}/status': {
      get: {
        summary: 'Get order status',
        tags: ['Orders'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Order status details' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/request-master': {
      post: {
        summary: 'Request support / hookah master override',
        tags: ['Orders'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Support requested successfully' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/promos': {
      get: {
        summary: 'Get all active promos',
        tags: ['Promos'],
        responses: {
          200: { description: 'List of active promos' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
