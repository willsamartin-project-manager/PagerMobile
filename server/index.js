const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for POC
    methods: ["GET", "POST"]
  }
});

// In-memory data store for POC
// Structure: { establishmentId: [ { id, name, phone, joinedAt, status } ] }
const queues = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join an establishment room (Admin or Customer)
  socket.on('join_room', (establishmentId) => {
    socket.join(establishmentId);
    console.log(`User ${socket.id} joined room ${establishmentId}`);
    // Send current queue state locally
    socket.emit('queue_update', queues[establishmentId] || []);
  });

  // Add a customer to the queue
  socket.on('add_customer', ({ establishmentId, name, phone }) => {
    if (!queues[establishmentId]) queues[establishmentId] = [];
    
    const newCustomer = {
      id: uuidv4(),
      socketId: socket.id, // Track socket ID to notify specific user if needed
      name,
      phone,
      joinedAt: new Date().toISOString(),
      status: 'waiting' // waiting, called, served
    };

    queues[establishmentId].push(newCustomer);
    
    // Boardcase update to everyone in the establishment room (Admins & Customers)
    io.to(establishmentId).emit('queue_update', queues[establishmentId]);
    
    // Confirm addition to the sender
    socket.emit('join_success', newCustomer);
  });

  // Call a customer
  socket.on('call_customer', ({ establishmentId, customerId }) => {
    const queue = queues[establishmentId];
    if (queue) {
      const customer = queue.find(c => c.id === customerId);
      if (customer) {
        customer.status = 'called';
        // Notify everyone (updates lists)
        io.to(establishmentId).emit('queue_update', queue);
        // Specific event for the customer to trigger vibration/alert
        // We can broadcast this to the room, the client will check if it matches their ID
        io.to(establishmentId).emit('customer_called', customerId);
      }
    }
  });

  // Remove/Complete a customer
  socket.on('remove_customer', ({ establishmentId, customerId }) => {
    if (queues[establishmentId]) {
      queues[establishmentId] = queues[establishmentId].filter(c => c.id !== customerId);
      io.to(establishmentId).emit('queue_update', queues[establishmentId]);
    }
  });
  
  // Status check (for client polling/reconnection)
  socket.on('get_status', ({ establishmentId, customerId }) => {
      const queue = queues[establishmentId];
      if(queue) {
          const customer = queue.find(c => c.id === customerId);
          if(customer) {
              socket.emit('status_update', customer);
          }
      }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
