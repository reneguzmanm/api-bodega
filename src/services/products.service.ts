interface Product{
    id: number,
    name: string,
    stock: number,
    
}

type CreateProduct = {
    name: string;
    stock: number;
};

const products: Product[] = [
    {id: 1, name: 'Box', stock:30},
    {id: 2, name: 'Label', stock:120},
    
]

export const getAllProducts = (): Product[] =>{
    return products;
};

export const getProductById = (id: number): Product | undefined =>{
    return products.find(product => product.id === id);
}

export const createProduct = (
    productData: CreateProduct
): Product =>{
    
    const newId = products.length > 0 ? Math.max(...products.map(product => product.id)) + 1 : 1;

    const newProduct: Product = {
        id: newId,
        ...productData
    };

    products.push(newProduct);

    return newProduct;

}

export const updateProduct = (
    id: number,
    productData: CreateProduct
): Product | undefined =>{
    const product = products.find(product => product.id === id);

    if(!product) return undefined;

    product.name = productData.name;
    product.stock = productData.stock;

    return product;
}

export const deleteProduct = (id: Number) : boolean =>{
    const index = products.findIndex(product => product.id === id);

    if(index === -1){
        return false;
    }

    products.slice(index, 1);

    return true;
}