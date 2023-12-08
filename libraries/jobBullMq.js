require('dotenv').config();
const Redis = require('ioredis');
const { Queue, Worker } = require('bullmq');

const QueueNameBinding = `work${os.hostname()}`;

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null});

// Create a new connection in every instance
const bindingQueue = new Queue(QueueNameBinding, { connection });

// Imprement Logic of Queue
const workBinding = new Worker(QueueNameBinding, async (job)=>{
    try{
        console.log(`job.data = ${JSON.stringify(job.data)}`);
        console.log('working on queue');
    }catch (error) {
        console.log(`Error worth logging: ${error}`);
        throw error; // still want to crash
    }

},{ concurrency: 2, connection });

workBinding.on('waiting', async (job) => {
    
    console.log(`${job?.id} has waiting!`);
});

workBinding.on('active', async ( job, prev ) => {
    
    console.log(`${job?.id} has active`);
});

workBinding.on('progress', async ( job, data ) => {
    
    console.log(`${job?.id} reported progress ${ JSON.stringify(data)}`);
});

workBinding.on('error', async (job) => {
    
    console.log(`${job?.id} has error!`);
});

workBinding.on('completed', async ( job, returnvalue ) => {
    
    console.log(`${job?.id} has completed!`);
});

workBinding.on('failed', async ( job, err ) => {
    console.log(`job ${job?.id} has failed with ${err.message}`);
});


const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, closing server...`);
    await workBinding.close();
    // Other asynchronous closings
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/* Start Function Add Queue */
async function runQueueJobs(reportParams){
    const job = await bindingQueue.add('jobBinding', reportParams, { removeOnComplete: true, removeOnFail: true });
    return job.id;
}

module.exports = { runQueueJobs }