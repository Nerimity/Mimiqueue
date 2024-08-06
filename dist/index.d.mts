import { createClient } from 'redis';
import { Queue as Queue$1 } from 'async-await-queue';

type RedisClient$1 = ReturnType<typeof createClient>;
interface QueueOpts<T> {
    name: string;
    redisClient: RedisClient$1;
    process: T;
}
declare class Queue<T extends (data: any) => Promise<any> = (data: any) => Promise<any>> {
    addQueue: Queue$1<unknown>;
    redisClient: RedisClient$1;
    name: string;
    prefix: string;
    ids: Map<string, [any, any]>;
    sub: RedisClient$1;
    processFn: T;
    constructor(opts: QueueOpts<T>);
    private startJob;
    add(data: any, opts?: {
        groupName?: string;
    }): Promise<unknown>;
}

type RedisClient = ReturnType<typeof createClient>;
interface AltQueueOpts {
    name: string;
    redisClient: RedisClient;
}
declare class AltQueue {
    addQueue: Queue$1<unknown>;
    redisClient: RedisClient;
    name: string;
    prefix: string;
    ids: Map<string, () => void>;
    sub: RedisClient;
    constructor(opts: AltQueueOpts);
    private startJob;
    start(opts?: {
        groupName?: string;
    }): Promise<() => Promise<void>>;
}

export { AltQueue, Queue };
