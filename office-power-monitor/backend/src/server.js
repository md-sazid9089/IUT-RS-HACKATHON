'use strict';

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { createApp } = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

/**
 * Bootstraps the HTTP server and Socket.IO instance.
 * Feature wiring (store, simulator, alerts, routes, sockets) is added in later modules.
 */
function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { id: socket.id });
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { id: socket.id, reason });
    });
  });

  server.listen(config.port, config.host, () => {
    logger.info('Backend listening', { host: config.host, port: config.port });
  });

  const shutdown = (signal) => {
    logger.warn('Shutting down', { signal });
    io.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
