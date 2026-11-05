import { Request, Response} from 'express';
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from '../services/products.service'

export const listProducts = (
    req: Request,
    res: Response
): void =>{
    const products = getAllProducts();

    res.status(200).json(products);
}

export const listProduct = (
    req: Request,
    res: Response,
): void =>{
    const id = Number(req.params.id);
    if(!Number.isInteger(id)|| id <= 0){
        res.status(400).json({
            message: 'Inavlid product ID'
        })
    }

    const product = getProductById(id);

    if(!product){
        res.status(404).json({
            message: 'Product not found'
        });
        return;
    }
    res.status(200).json(product)
}

export const addProduct = (
    req: Request,
    res: Response
): void =>{
    const {name, stock} = req.body;

    if(typeof name !== 'string' || name. trim() === ''){
        res.status(400).json({
            message: 'Invalid product name'
        })
        return;
    }

    if(!Number.isInteger(stock) || stock < 0){
        res.status(400).json({
            message: 'Invalid product stock'
        })
        return;
    }

    const newProduct = createProduct({
        name: name.trim(),
        stock
    });
    res.status(201).json(newProduct)

}

export const editProduct = (
    req: Request,
    res: Response
): void =>{
    const id = Number(req.params.id);
    if(!Number.isSafeInteger(id) || id <= 0){
        res.status(400).json({
            message: 'Invalid product ID'
        })
        return;
    }
    const { name, stock} = req.body ?? {};

    if(typeof name !== 'string' || name. trim() === ''){
        res.status(400).json({
            message: 'Invalid product name'
        })
        return;
    }

    if(!Number.isInteger(stock) || stock < 0){
        res.status(400).json({
            message: 'Invalid product stock'
        })
        return;
    }

    const updatedProduct = updateProduct(id,{
        name: name.trim(),
        stock,
    })

    if(!updatedProduct){
        res.status(404).json({
            message:'Product not found'
        });
        return;
    }

    res.status(200).json(updatedProduct);
}

export const removeProduct = (
    req: Request,
    res: Response,
): void =>{
    const id = Number(req.params.id);

    if(!Number.isSafeInteger(id) || id <= 0){
        res.status(400).json({
            message: 'Invalid product ID'
        })
        return;
    }

    const deleted = deleteProduct(id);

    if(!deleted){
        res.status(404).json({message:'Product not found'});
        return;

    }
    res.status(204).send()
}