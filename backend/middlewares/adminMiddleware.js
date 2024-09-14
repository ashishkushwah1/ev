const jwt = require('jsonwebtoken');
function adminMiddleware(req, res, next) {
    try{
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(decoded.role!=='admin'){
            return res.status(403).json({ message: `Access denied. Requires Admin Role` });
        } else{
            next();
        }
    } catch(err){
        return res.status(500).json({ message: 'Internal Server Error', error: err });
    }
}
module.exports = adminMiddleware;