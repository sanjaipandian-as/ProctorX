import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);

        // Provide helpful error messages
        if (error.message.includes('ETIMEOUT') || error.message.includes('querySrv')) {
            console.error('\n🔍 Troubleshooting tips:');
            console.error('1. Check your internet connection');
            console.error('2. Verify MongoDB Atlas cluster is running');
            console.error('3. Check if your IP address is whitelisted in MongoDB Atlas');
            console.error('4. Verify the MONGO_URI in your .env file is correct');
            console.error('5. Try using a different network (VPN might be blocking)');
        }

        process.exit(1);
    }
};

export default connectDB;
