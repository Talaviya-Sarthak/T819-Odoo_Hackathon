'use strict';

const io = require('../frontend/node_modules/socket.io-client');
const prisma = require('../backend/src/database/prisma');

const BASE_URL = 'http://localhost:5000';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return data.data || data;
}

async function runTest() {
  console.log('=== DEALFLOW360 REAL-TIME WEBSOCKET NEGOTIATION TEST ===\n');

  // 1. Authenticate Sales Rep & Customer
  console.log('[1/7] Authenticating users...');
  const salesAuth = await login('sales@dealflow360.com', 'demo1234');
  console.log(`✓ Sales Rep authenticated: ${salesAuth.user.name} (${salesAuth.user.role})`);

  const customerUser = await prisma.user.findFirst({
    where: { email: 'customer@dealflow360.com' },
  });
  if (!customerUser) throw new Error('No customer user found in DB');

  const customerAuth = await login('customer@dealflow360.com', 'demo1234');
  console.log(`✓ Customer authenticated: ${customerUser.email} (Customer ID: ${customerUser.customerId})`);

  // 2. Find quotation belonging to customer
  console.log('\n[2/7] Finding quotation for negotiation...');
  let quotation = await prisma.quotation.findFirst({
    where: { customerId: customerUser.customerId },
  });

  if (!quotation) {
    quotation = await prisma.quotation.findFirst();
    // Reassign customerId for test
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { customerId: customerUser.customerId },
    });
  }
  console.log(`✓ Using quotation: ${quotation.id} (${quotation.quotationNumber || 'QT'})`);

  // 3. Connect WebSockets
  console.log('\n[3/7] Connecting WebSockets with JWT tokens...');
  const customerSocket = io(BASE_URL, {
    auth: { token: customerAuth.accessToken },
    transports: ['websocket'],
  });

  const salesSocket = io(BASE_URL, {
    auth: { token: salesAuth.accessToken },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve, reject) => {
      customerSocket.on('connect', resolve);
      customerSocket.on('connect_error', reject);
    }),
    new Promise((resolve, reject) => {
      salesSocket.on('connect', resolve);
      salesSocket.on('connect_error', reject);
    }),
  ]);
  console.log('✓ Both Customer and Sales Rep connected to WebSocket server!');

  // 4. Join quotation room
  console.log('\n[4/7] Joining negotiation room...');
  await new Promise((resolve, reject) => {
    customerSocket.emit('join_negotiation', { quotationId: quotation.id }, (res) => {
      if (res?.error) reject(new Error(res.error));
      else resolve(res);
    });
  });
  console.log(`✓ Customer joined room: negotiation:${quotation.id}`);

  await new Promise((resolve, reject) => {
    salesSocket.emit('join_negotiation', { quotationId: quotation.id }, (res) => {
      if (res?.error) reject(new Error(res.error));
      else resolve(res);
    });
  });
  console.log(`✓ Sales Rep joined room: negotiation:${quotation.id}`);

  // 5. Test Customer -> Sales Rep real-time messaging + DB persistence
  console.log('\n[5/7] Testing real-time message Customer -> Sales Rep...');
  const testMessageText = `Hello Sales Rep, can we discuss terms for this quotation? [Timestamp: ${Date.now()}]`;

  const salesReceivedPromise = new Promise((resolve) => {
    salesSocket.on('new_message', (msg) => {
      if (msg.message === testMessageText) {
        resolve(msg);
      }
    });
  });

  customerSocket.emit('send_message', {
    quotationId: quotation.id,
    message: testMessageText,
    clientMessageId: 'client-msg-1',
  });

  const salesReceivedMsg = await salesReceivedPromise;
  console.log(`✓ Sales Rep received real-time message: "${salesReceivedMsg.message}" from sender: ${salesReceivedMsg.sender?.name}`);

  // Verify DB persistence
  const dbMsg = await prisma.negotiationMessage.findFirst({
    where: { message: testMessageText },
  });
  if (!dbMsg) throw new Error('Message not persisted in PostgreSQL DB!');
  console.log(`✓ Verified in PostgreSQL DB: Message ID ${dbMsg.id}, Negotiation ID ${dbMsg.negotiationId}`);

  // 6. Test Sales Rep -> Customer real-time messaging
  console.log('\n[6/7] Testing real-time message Sales Rep -> Customer...');
  const repMessageText = `Certainly! I would be happy to review your requested adjustments. [Timestamp: ${Date.now()}]`;

  const customerReceivedPromise = new Promise((resolve) => {
    customerSocket.on('new_message', (msg) => {
      if (msg.message === repMessageText) {
        resolve(msg);
      }
    });
  });

  salesSocket.emit('send_message', {
    quotationId: quotation.id,
    message: repMessageText,
    clientMessageId: 'client-msg-2',
  });

  const customerReceivedMsg = await customerReceivedPromise;
  console.log(`✓ Customer received real-time reply: "${customerReceivedMsg.message}" from sender: ${customerReceivedMsg.sender?.name}`);

  // 7. Test Counter-Discount Workflow via WebSocket
  console.log('\n[7/7] Testing counter-discount submission via WebSocket...');
  const statusChangePromise = new Promise((resolve) => {
    salesSocket.on('quotation_status_changed', (data) => {
      if (data.quotationId === quotation.id) {
        resolve(data);
      }
    });
  });

  customerSocket.emit('request_counter_discount', {
    quotationId: quotation.id,
    requestedDiscountPercent: 12.5,
    notes: 'Bulk order commitment for Q3',
  });

  const statusChangeData = await statusChangePromise;
  console.log(`✓ Sales Rep received quotation_status_changed event: Stage -> ${statusChangeData.status}`);

  const dbChangeRequest = await prisma.changeRequest.findFirst({
    where: { negotiation: { quotationId: quotation.id } },
    orderBy: { createdAt: 'desc' },
  });
  if (!dbChangeRequest) throw new Error('ChangeRequest not persisted in PostgreSQL DB!');
  console.log(`✓ Verified ChangeRequest in PostgreSQL DB: ID ${dbChangeRequest.id}, status: ${dbChangeRequest.status}, details:`, dbChangeRequest.newValue);

  // Close sockets
  customerSocket.disconnect();
  salesSocket.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL REAL-TIME WEBSOCKET NEGOTIATION TESTS PASSED!');
  console.log('======================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
