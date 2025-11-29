import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import Submission from '../models/Submission.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Setup R2 Client
        let r2Client = null;
        if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
            r2Client = new S3Client({
                region: 'auto',
                endpoint: process.env.R2_ENDPOINT,
                credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY_ID,
                    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
                }
            });
            console.log('✅ R2 Client initialized');
        }

        console.log('Finding old submissions...');
        const allSubmissions = await Submission.find({});

        const oldSubmissions = allSubmissions.filter(sub => {
            if (!sub.fileUrl) return true;
            // Exclude new bucket submissions (start with "submissions/")
            if (sub.fileUrl.startsWith('submissions/')) return false;
            return true;
        });

        console.log(`Found ${oldSubmissions.length} old submissions to clean up.`);

        if (oldSubmissions.length === 0) {
            console.log('No old submissions found. Exiting.');
            process.exit(0);
        }

        let deletedFilesCount = 0;

        if (r2Client && process.env.R2_BUCKET_NAME) {
            console.log('Attempting to delete files from R2...');
            for (const sub of oldSubmissions) {
                if (sub.fileUrl && sub.fileUrl.startsWith('http')) {
                    try {
                        const urlObj = new URL(sub.fileUrl);
                        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

                        if (key) {
                            await r2Client.send(new DeleteObjectCommand({
                                Bucket: process.env.R2_BUCKET_NAME,
                                Key: key
                            }));
                            process.stdout.write('.');
                            deletedFilesCount++;
                        }
                    } catch (err) {
                        // Ignore errors (file might not exist or different bucket)
                    }
                }
            }
            console.log(`\nDeleted ${deletedFilesCount} files from R2.`);
        }

        const oldSubmissionIds = oldSubmissions.map(sub => sub._id);
        const result = await Submission.deleteMany({ _id: { $in: oldSubmissionIds } });

        console.log(`✅ Successfully deleted ${result.deletedCount} old submission records from database.`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

cleanup();
