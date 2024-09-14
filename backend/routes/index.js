const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const eventRouter = require('./event');
router.use('/events', eventRouter);
router.use('/user', userRouter);
module.exports = router;