import dotenv from 'dotenv';
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

async function testConnection() {
    console.log('Testing R2 Connection...');
    console.log('Endpoint:', process.env.R2_ENDPOINT);
    console.log('Bucket:', process.env.R2_BUCKET_NAME);

    try {
        console.log('Listing buckets...');
        const { Buckets } = await r2Client.send(new ListBucketsCommand({}));
        console.log('Buckets:', Buckets.map(b => b.Name));

        const bucketExists = Buckets.some(b => b.Name === process.env.R2_BUCKET_NAME);
        if (!bucketExists) {
            console.error(`❌ Bucket "${process.env.R2_BUCKET_NAME}" not found in account!`);
            return;
        }
        console.log(`✅ Bucket "${process.env.R2_BUCKET_NAME}" found.`);

        console.log('Attempting test upload...');
        const testKey = 'test-upload-' + Date.now() + '.txt';
        await r2Client.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: testKey,
            Body: 'Hello from verification script',
            ContentType: 'text/plain'
        }));
        console.log(`✅ Test upload successful: ${testKey}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testConnection();
