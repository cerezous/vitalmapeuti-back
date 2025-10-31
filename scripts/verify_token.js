const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXN1YXJpbyI6Im1jZXJlem8iLCJlc3RhbWVudG8iOiJLaW5lc2lvbG9nw61hIiwiaWF0IjoxNzU5OTM3NjAzLCJleHAiOjE3NjAwMjQwMDN9.xE-w6rbqplLnbHVnsyYhcUtsWstG0mYAI_QBAfoGwwc';
const secret = process.env.JWT_SECRET || 'vitalmape-secret-key-2024';


try {
  const decoded = jwt.verify(token, secret);
} catch (error) {
}
