const express = require('express');
const { Event } = require('../db');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const transporter = require('../services/emailService');

//to get all events for all users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const events = await Event.find({}).populate('organiser', 'name').select('-attendees');;
        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error });
    }
});

//to get event details for a particular event for all users
router.get('/:eventId', authMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await Event.findById(eventId).populate('organiser', 'name').select('-attendees');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ event });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event details', error });
    }
});

// to get events created by logged in admin
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const events = await Event.find({ organiser: userId }).select('-attendees');
        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error });
    }
});

// to get all details of an event created by admin excluding attendees
router.get('/admin/:eventId', authMiddleware, adminMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await Event.findById(eventId).select('-attendees');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ event });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event details', error });
    }
});

// to get attendess of an event created by admin
router.get('/admin/:eventId/attendees', authMiddleware, adminMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await Event.findById(eventId).populate('attendees.user', 'email name'); // Including attendees
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ event });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendee details', error });
    }
});

//to delete attendees from an event created by admin
router.delete('/admin/:eventId/attendees/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.params.userId;
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        event.attendees = event.attendees.filter(attendee => attendee.user.toString() !== userId);
        await event.save();
        res.status(200).json({ message: 'Attendee removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting attendee', error });
    }
})

// create an event
router.post('/admin/create', authMiddleware, adminMiddleware, async (req, res) => {
    const body = req.body;
    const userId = req.user.id;
    try {
        const event = new Event({
            ...body,
            organiser: userId
        });
        await event.save();
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error });
    }
});

// schedule an event
router.put('/admin/:eventId/schedule', authMiddleware, adminMiddleware, async (req, res) => {
    const { startDate, endDate } = req.body;
    const eventId = req.params.eventId;
    try {
        const event = Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        event.startDate = new Date(startDate);
        event.endDate = new Date(endDate);
        await event.save();

        res.status(200).json({ message: 'Event schedule updated successfully', event });
    } catch (error) {
        res.status(500).json({ message: 'Error updating event schedule', error });
    }
});

//delete an event
router.delete('/admin/delete/:eventId', authMiddleware, adminMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        await event.deleteOne();
        res.status(200).json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', err });
    }
})

//get rsvp status for an event
router.post('/:eventId/rsvp', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const eventId = req.params.eventId;
    try {
        // Find the event by its ID
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the user has already RSVP'd
        if (event.rsvps.includes(userId)) {
            return res.status(400).json({ message: 'You have already RSVP\'d for this event' });
        }

        // Add the user's RSVP to the event
        event.rsvps.push(userId);
        await event.save();

        res.status(200).json({ message: 'RSVP successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

//to notify attendees
router.post('/:eventId/notify', authMiddleware, adminMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    try {
        const event = await Event.findById(eventId)
            .populate('oraganiser', 'name')
            .populate({
                path: 'attendees.user',
                select: 'email'
            });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        //email object
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: event.attendees.map(attendee => attendee.user.email),
            subject: `Reminder: ${event.name}`,
            text: `Hello,

            Reminder for the upcoming event:

            Event: ${event.name}
            Description: ${event.description}
            Date: ${event.startDate} - ${event.endDate}
            Location: ${event.location}

            Please mark your calendar!

            Best regards,
            Event Management Team`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending notification', error });
    }
})
module.exports = router;