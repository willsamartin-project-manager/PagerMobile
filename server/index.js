const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// AUTH ENDPOINTS
app.post('/api/register', async (req, res) => {
  const { id, name, password } = req.body;
  if (!id || !name || !password) return res.status(400).json({ error: 'Missing fields' });

  // Sanitize ID
  const slug = id.toLowerCase().replace(/\s+/g, '-');

  try {
    const { data, error } = await supabase
      .from('establishments')
      .insert([{ id: slug, name, password }]) // In real app, hash password!
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'ID already exists' });
      throw error;
    }

    res.json({ success: true, establishment: data });
  } catch (e) {
    console.error("Register Error", e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'Missing fields' });

  // SUPER ADMIN CHECK
  if (id === 'admin' && password === 'KT6MQ-cwu3J7ZKD') {
    return res.json({ success: true, superAdmin: true });
  }

  const slug = id.toLowerCase().replace(/\s+/g, '-');

  try {
    const { data, error } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', slug)
      .eq('password', password) // In real app, compare hash!
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ success: true, establishment: data });
  } catch (e) {
    console.error("Login Error", e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/establishments', async (req, res) => {
  // In real app, verify admin token here
  try {
    const { data, error } = await supabase
      .from('establishments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (e) {
    console.error("Fetch Establishments Error", e);
    res.status(500).json({ error: 'Server error' });
  }
});

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async (establishmentId) => {
    socket.join(establishmentId);

    // Fetch and send current queue
    const { data: queue, error } = await supabase
      .from('queue')
      .select(`*, customers (name, phone)`)
      .eq('establishment_id', establishmentId)
      .in('status', ['waiting', 'called'])
      .order('created_at', { ascending: true });

    if (!error && queue) {
      const formattedQueue = queue.map(entry => ({
        id: entry.customer_id,
        name: entry.customers?.name,
        phone: entry.customers?.phone,
        status: entry.status,
        entry_id: entry.id
      }));
      socket.emit('queue_update', formattedQueue);
    }
  });

  socket.on('add_customer', async ({ establishmentId, name, phone }) => {
    try {
      // Find or Create Customer
      let customerId;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phone)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert([{ name, phone }])
          .select()
          .single();
        if (error) {
          console.error("Error creating customer", error);
          return;
        }
        customerId = newCustomer.id;
      }

      // Add to Queue if not exists
      const { data: activeEntry } = await supabase
        .from('queue')
        .select('id')
        .eq('establishment_id', establishmentId)
        .eq('customer_id', customerId)
        .in('status', ['waiting', 'called'])
        .single();

      if (!activeEntry) {
        await supabase.from('queue').insert([{
          establishment_id: establishmentId,
          customer_id: customerId,
          status: 'waiting'
        }]);
      }

      // Broadcast Update
      const { data: updatedQueue } = await supabase
        .from('queue')
        .select('*, customers(name, phone)')
        .eq('establishment_id', establishmentId)
        .in('status', ['waiting', 'called'])
        .order('created_at', { ascending: true });

      const formattedQueue = updatedQueue.map(entry => ({
        id: entry.customer_id,
        name: entry.customers?.name,
        phone: entry.customers?.phone,
        status: entry.status,
        entry_id: entry.id
      }));

      io.to(establishmentId).emit('queue_update', formattedQueue);
      socket.emit('join_success', { id: customerId, name, phone });

    } catch (e) {
      console.error("Error in add_customer", e);
    }
  });

  socket.on('call_customer', async ({ establishmentId, customerId }) => {
    await supabase
      .from('queue')
      .update({ status: 'called' })
      .eq('establishment_id', establishmentId)
      .eq('customer_id', customerId)
      .eq('status', 'waiting');

    // Broadcast
    const { data: updatedQueue } = await supabase
      .from('queue')
      .select('*, customers(name, phone)')
      .eq('establishment_id', establishmentId)
      .in('status', ['waiting', 'called'])
      .order('created_at', { ascending: true });

    const formattedQueue = updatedQueue.map(entry => ({
      id: entry.customer_id,
      name: entry.customers?.name,
      phone: entry.customers?.phone,
      status: entry.status,
      entry_id: entry.id
    }));

    io.to(establishmentId).emit('queue_update', formattedQueue);
    io.to(establishmentId).emit('customer_called', customerId);
  });

  socket.on('remove_customer', async ({ establishmentId, customerId }) => {
    await supabase
      .from('queue')
      .update({ status: 'completed' })
      .eq('establishment_id', establishmentId)
      .eq('customer_id', customerId);

    // Broadcast
    const { data: updatedQueue } = await supabase
      .from('queue')
      .select('*, customers(name, phone)')
      .eq('establishment_id', establishmentId)
      .in('status', ['waiting', 'called'])
      .order('created_at', { ascending: true });

    const formattedQueue = updatedQueue ? updatedQueue.map(entry => ({
      id: entry.customer_id,
      name: entry.customers?.name,
      phone: entry.customers?.phone,
      status: entry.status,
      entry_id: entry.id
    })) : [];

    io.to(establishmentId).emit('queue_update', formattedQueue);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
