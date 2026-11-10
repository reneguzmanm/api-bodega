import express from 'express';
import productsRouter from './routes/products.routes'
import locationsRoutes  from './routes/locations.routes'

const app = express();

app.use(express.json());

app.use('/products', productsRouter);
app.use('/locations', locationsRoutes)

export default app;