import jwt from 'jsonwebtoken';
import prisma from '../../prisma/prismaClient.js';

export async function verifyMaster(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Token yok' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token yok' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // DB'den master_user kontrolü
        const master = await prisma.master_user.findUnique({
            where: { id: payload.id }
        });

        if (!master) return res.status(403).json({ message: 'Master admin değil' });

        req.master = master; // request içine master bilgisini ekle
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token geçersiz', error: err.message });
    }
}
