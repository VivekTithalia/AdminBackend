import mongoose from "mongoose"

const Connectdb = async () => {
    try {
        const myconnection = await mongoose.connect(process.env.MONGO_URL)
        if (myconnection) {
            console.log("Database connected");
        }

    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1);


    }

}
export default Connectdb