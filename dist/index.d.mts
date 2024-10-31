import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

interface createQueueOpts<T = () => any> {
    redisClient: RedisClient;
    name: string;
}
interface AddOpts {
    groupName?: string;
}
declare const createQueue: (opts: createQueueOpts) => {
    add: <T extends () => any>(func: T, opts?: AddOpts) => Promise<Awaited<ReturnType<T>>>;
};

interface CreateQueueProcessorOpts {
    redisClient: RedisClient;
}
/**
 *  This function should be ran in the main thread.
 *
 */
declare const createQueueProcessor: (opts: CreateQueueProcessorOpts) => void;

export { createQueue, createQueueProcessor };
