/* TẦNG ROUTE — chỉ điều phối HTTP. Toàn bộ nghiệp vụ gom dữ liệu và
   gọi Claude API đã nằm ở services/chat.service.js. */
const express = require('express');
const router  = express.Router();

const chatService = require('../services/chat.service');
const ah = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');

module.exports = (apiKey) => {

  router.post('/chat', requireAuth, ah(async (req, res) => {
    const reply = await chatService.hoiClaude(apiKey, req.body.message);
    res.json({ reply });
  }));

  return router;
};
