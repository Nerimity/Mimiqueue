import { Queue } from "async-await-queue";
import { RedisClient, Event, StartEvent } from "./types";
import { makeKey } from "./utils";
import { setTimeout } from "timers/promises";

interface CreateQueueProcessorOpts {
  prefix?: string;
  redisClient: RedisClient;
}

interface QueueOption {
  minTime?: number;
  localQueue: Queue;
}
/**
 *  This function should be ran in the main thread.
 *
 */
export const createQueueProcessor = async (opts: CreateQueueProcessorOpts) => {
  if (opts.prefix) {
    opts.prefix = `-${opts.prefix}`;
  } else {
    opts.prefix = "";
  }
  const redisClient = opts.redisClient;
  const queueOptions: Map<string, QueueOption> = new Map();

  const sub = redisClient.duplicate();
  await sub.connect();

  let keysToDelete = [];
  for await (const key of sub.scanIterator({
    MATCH: `mq${opts.prefix}:*`,
  })) {
    keysToDelete.push(key);
  }
  if (keysToDelete.length) {
    await redisClient.del(keysToDelete);
    keysToDelete = [];
  }

  await sub.subscribe(`mq${opts.prefix}`, async (message) => {
    const payload = JSON.parse(message) as Event;

    if (payload.event === "options") {
      if (queueOptions.has(payload.name)) {
        return;
      }
      queueOptions.set(payload.name, {
        minTime: payload.minTime,
        localQueue: new Queue(1),
      });
      return;
    }
    const options = queueOptions.get(payload.name);
    const localQueue = options?.localQueue;

    if (!options || !localQueue) {
      return;
    }

    localQueue.run(async () => {
      if (payload.event === "add") {
        const activeKey = makeKey(
          `mq${opts.prefix}`,
          payload.name,
          payload.groupName,
          "active"
        );
        const waitKey = makeKey(
          `mq${opts.prefix}`,
          payload.name,
          payload.groupName,
          "wait"
        );

        const activeEntriesLength = await redisClient.lLen(activeKey);
        if (activeEntriesLength) {
          return;
        }

        await redisClient.lRem(waitKey, 1, payload.id);
        await redisClient.rPush(activeKey, payload.id);
        if (options.minTime) {
          await setTimeout(options.minTime);
        }
        redisClient.publish(
          `mq${opts.prefix}`,
          JSON.stringify({ ...payload, event: "start" } as StartEvent)
        );
      }

      if (payload.event === "finish") {
        const activeKey = makeKey(
          `mq${opts.prefix}`,
          payload.name,
          payload.groupName,
          "active"
        );
        await redisClient.lRem(activeKey, 1, payload.id);

        const waitKey = makeKey(
          `mq${opts.prefix}`,
          payload.name,
          payload.groupName,
          "wait"
        );

        const firstWaitingId = await redisClient.lPop(waitKey);

        if (firstWaitingId) {
          await redisClient.rPush(activeKey, firstWaitingId);
          if (options.minTime) {
            await setTimeout(options.minTime);
          }
          redisClient.publish(
            `mq${opts.prefix}`,
            JSON.stringify({
              ...payload,
              id: firstWaitingId,
              event: "start",
            } as StartEvent)
          );
        }
      }
    });
  });
};
