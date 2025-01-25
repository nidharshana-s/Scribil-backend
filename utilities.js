const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' })

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        console.log(token)
        //console.log(verify(token, process.env.SECRET_KEY))
        if (err) return res.status(403).json({ message: 'Token is invalid.'})

        req.user = user;
        next();
    })
}

module.exports = {
    authenticateToken,
}