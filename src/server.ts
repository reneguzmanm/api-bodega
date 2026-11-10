
import app from './app';
import { prisma } from './lib/prisma';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = 3000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

const connectToDatabase = async (): Promise<boolean> => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await prisma.$queryRaw`SELECT 1`;

            console.log('Database connection established');
            return true;
        } catch (error) {
            console.error(
                `Database connection failed (${attempt}/${MAX_RETRIES})`
            );

            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS);
            } else {
                console.error('Final database connection error:', error);
            }
        }
    }

    return false;
};

const startServer = async (): Promise<void> => {
    const connected = await connectToDatabase();

    if (!connected) {
        console.error('Unable to connect to the database');
        await prisma.$disconnect();
        process.exitCode = 1;
        return;
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

void startServer();
