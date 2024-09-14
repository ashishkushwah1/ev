const express = require('express');
const jwt = require('jsonwebtoken');
const zod = require('zod');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User, Event } = require('../db'); // Ensure Event is imported here
const authMiddleware = require('../middlewares/authMiddleware'); // Ensure this is correctly imported

const signupSchema = zod.object({
    name: zod.string(),
    email: zod.string().email(),
    password: zod.string().min(6)
});

router.post('/signup', async (req, res) => {
    const body = req.body;
    try {
        const validate = signupSchema.safeParse(body);
        if (!validate.success) {
            return res.status(411).send('Incorrect format');
        }
        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
            return res.status(411).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const user = new User({ ...body, password: hashedPassword });
        await user.save();
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });

    } catch (err) {
        console.err("error in signing in", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.post('/signin', async (req, res) => {
    const body = req.body;
    try {
        const user = await User.findOne({ email: body.email }); 
        if (!user) {
            return res.status(411).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(body.password, user.password);
        if (!isMatch) {
            return res.status(411).json({ message: 'Wrong password' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error("error in signing in", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get RSVPs for logged-in user
router.get('/:userId/rsvps', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        // Find events where the user is listed in the attendees array
        const events = await Event.find({
            'attendees.user': userId
        }).populate('organiser', 'name').select('name description startDate endDate location attendees');

        // Filter the user's specific RSVP from the attendees list for each event
        const userRSVPs = events.map(event => {
            const userRsvpInfo = event.attendees.find(att => att.user.toString() === userId);
            return {
                eventId: event._id,
                eventName: event.name,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                location: event.location,
                rsvpStatus: userRsvpInfo ? userRsvpInfo.rsvpStatus : 'No RSVP found'
            };
        });

        res.status(200).json({ rsvps: userRSVPs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching RSVPs', error });
    }
});

module.exports = router;
