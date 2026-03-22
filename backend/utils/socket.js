const socketIo = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    io = socketIo(httpServer, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT"]
      }
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected via WebSocket:', socket.id);
      
      // Clients can join specific department rooms or user ID rooms
      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User mapped to room: ${room}`);
      });

      socket.on('disconnect', () => {
         // Handle disconnects elegantly
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      console.warn('⚠️ Socket.io called before initialization');
    }
    return io;
  }
};
