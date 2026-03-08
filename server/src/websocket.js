const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// Map of problemId -> Set of WebSocket connections
const problemSubscribers = new Map();

/**
 * Set up WebSocket server on the given HTTP server.
 * Admin clients connect to /ws/problems/:id/status with JWT auth.
 */
function setupWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsed = url.parse(request.url, true);
    const match = parsed.pathname.match(/^\/ws\/problems\/([^/]+)\/status$/);

    if (!match) {
      socket.destroy();
      return;
    }

    const problemId = match[1];

    // Authenticate via query param or cookie
    const token = parsed.query.token || parseCookie(request.headers.cookie, 'jwt');
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      // Subscribe this connection to the problem
      if (!problemSubscribers.has(problemId)) {
        problemSubscribers.set(problemId, new Set());
      }
      problemSubscribers.get(problemId).add(ws);

      ws.on('close', () => {
        const subs = problemSubscribers.get(problemId);
        if (subs) {
          subs.delete(ws);
          if (subs.size === 0) problemSubscribers.delete(problemId);
        }
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: 'connected', problemId }));
    });
  });

  return wss;
}

/**
 * Emit an event to all admin WebSocket subscribers for a given problem.
 */
function emitParticipantEvent(problemId, event) {
  const subs = problemSubscribers.get(problemId);
  if (!subs) return;

  const message = JSON.stringify(event);
  for (const ws of subs) {
    if (ws.readyState === 1) { // OPEN
      ws.send(message);
    }
  }
}

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

module.exports = {
  setupWebSocket,
  emitParticipantEvent,
};
