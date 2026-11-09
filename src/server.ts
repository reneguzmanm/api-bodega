
import app from './app';
import { prisma } from './lib/prisma';

const PORT = 3000;

const startServer = async (): Promise<void> => {
    try {
        await prisma.$connect();

        console.log('Database connection established');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        await prisma.$disconnect();
        process.exitCode = 1;
    }
};

void startServer();