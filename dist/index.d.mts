import { createClient } from 'redis';
import { Queue as Queue$1 } from 'async-await-queue';

type RedisClient = ReturnType<typeof createClient>;
interface QueueOpts<T> {
    name: string;
    redisClient: RedisClient;
    process: T;
}
declare class Queue<T extends (data: any) => Promise<any> = (data: any) => Promise<any>> {
    addQueue: Queue$1<unknown>;
    redisClient: RedisClient;
    name: string;
    prefix: string;
    ids: Map<string, [any, any]>;
    sub: RedisClient;
    processFn: T;
    constructor(opts: QueueOpts<T>);
    private startJob;
    add(data: any, opts?: {
        groupName?: string;
    }): Promise<unknown>;
}

export { Queue };
