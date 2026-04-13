import { PrismaClient } from "@/generated/prisma-common/client"
import dotenv from "dotenv"

dotenv.config(); 

const logData = async () => {

    const prisma = new PrismaClient(); 

    const data = await prisma.mstcmpnfo.findMany({}); 

    return console.log(data); 
}

logData().then(() => console.log("RAN SUCCESSFULLY")).catch((err) => console.log("ERROR: ", err)); 