import jwt from "jsonwebtoken";

export function decodeUser(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }

        req.user = decoded; // contains sub = user id
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token decode failed" });
    }
}