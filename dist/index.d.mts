import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

interface createQueueOpts<T = () => any> {
    redisClient: RedisClient;
    name: string;
    globalMinTime?: number;
}
interface AddOpts {
    groupName?: string;
    minTime?: number;
}
declare const createQueue: (opts: createQueueOpts) => {
    add: <T extends () => any>(func: T, addOpts?: AddOpts) => Promise<ReturnType<T>>;
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
