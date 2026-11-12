import { prisma } from '../lib/prisma'

export const getAllInventory = async () =>{
    return prisma.inventory.findMany({
        include:{
            product:{
                select:{
                    id:true,
                    sku:true,
                    name:true
                }
            },
            location:{
                select:{
                    id:true,
                    zone: true,
                    aisle: true,
                    rack: true,
                    level: true,
                    position: true,
                }
            }
        },
        orderBy:[
            {productId: 'asc'},
            {locationId: 'asc'},
        ]
    })
}