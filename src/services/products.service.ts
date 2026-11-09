import { prisma } from "../lib/prisma";


interface Product{
    id: number,
    name: string,
    stock: number,
    
}

type CreateProduct = {
    name: string;
    stock: number;
};

export type CreateProductInput = {
    sku: string;
    name: string;
};

export type UpdateProductInput = {
    sku: string;
    name: string;
};


const products: Product[] = [
    {id: 1, name: 'Box', stock:30},
    {id: 2, name: 'Label', stock:120},
    
]

export const getAllProducts = async () => {
    return prisma.product.findMany({
        where: {
            isActive: true
        },
        orderBy: {
            id: 'asc'
        }
    });
};

export const getProductById = async (id: number) => {
    return prisma.product.findUnique({
        where: {
            id,
            isActive: true
        }
    });
};

export const createProduct = async (
    productData: CreateProductInput
) =>{
    
    return prisma.product.create({
        data:{
            sku: productData.sku,
            name: productData.name,
        }
    });

}

export const updateProduct = async (
    id: number,
    productData: UpdateProductInput
) =>{
    return prisma.product.update({
        where: { id },
        data:{
            sku: productData.sku,
            name: productData.name,
        }
    })
}


export const deactivateProduct = async (id: number): Promise<boolean> => {
    const result = await prisma.product.updateMany({
        where: {
            id,
            isActive: true
        },
        data: {
            isActive: false
        }
    });

    return result.count > 0;
};
