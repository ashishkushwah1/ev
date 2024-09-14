const jwt = require('jsonwebtoken');
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'No token provided' });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userId) {
            req.user = { id: decoded.userId };
            next();
        } else {
            return res.status(403).json({ message: 'Invalid token' });
        }
    } catch (err) {
        return res.status(403).json({message:'Token verification failed', error:err});
    }
}
module.exports = authMiddleware;