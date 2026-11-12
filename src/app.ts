import express from 'express';
import productsRouter from './routes/products.routes'
import locationsRoutes  from './routes/locations.routes'
import inventoryRoutes from './routes/inventory.routes'
const app = express();

app.use(express.json());

app.use('/products', productsRouter);
app.use('/locations', locationsRoutes)
app.use('/inventory', inventoryRoutes)

export default app;