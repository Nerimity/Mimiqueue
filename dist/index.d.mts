import { createClient } from 'redis';
import { Queue as Queue$1 } from 'async-await-queue';

type RedisClient$2 = ReturnType<typeof createClient>;
interface QueueOpts<T> {
    name: string;
    redisClient: RedisClient$2;
    process: T;
    prefix?: string;
}
declare class Queue<T extends (data: any) => Promise<any> = (data: any) => Promise<any>> {
    addQueue: Queue$1<unknown>;
    redisClient: RedisClient$2;
    name: string;
    prefix: string;
    ids: Map<string, [any, any]>;
    sub: RedisClient$2;
    processFn: T;
    constructor(opts: QueueOpts<T>);
    private startJob;
    add(data: any, opts?: {
        groupName?: string;
    }): Promise<unknown>;
}

type RedisClient$1 = ReturnType<typeof createClient>;
interface AltQueueOpts {
    name: string;
    redisClient: RedisClient$1;
    prefix?: string;
}
declare class AltQueue {
    addQueue: Queue$1<unknown>;
    redisClient: RedisClient$1;
    name: string;
    prefix: string;
    ids: Map<string, () => void>;
    sub: RedisClient$1;
    constructor(opts: AltQueueOpts);
    private startJob;
    start(opts?: {
        groupName?: string;
    }): Promise<() => Promise<void>>;
}

declare class AltQueue2 {
    private _altQueue;
    constructor(opts: AltQueueOpts);
    add(cb: () => Promise<void>, opts: {
        groupName?: string;
    }): Promise<void>;
}

type RedisClient = ReturnType<typeof createClient>;
interface HandleTimeoutOpts {
    redisClient: RedisClient;
    prefix?: string;
    duration?: number;
}
declare function handleTimeout(opts: HandleTimeoutOpts): Promise<void>;

export { AltQueue, AltQueue2, type AltQueueOpts, Queue, handleTimeout };
