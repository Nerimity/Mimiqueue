import { Queue } from "async-await-queue";
import { RedisClient, Event, StartEvent } from "./types";
import { makeKey } from "./utils";

interface CreateQueueProcessorOpts {
  redisClient: RedisClient;
}
/**
 *  This function should be ran in the main thread.
 *
 */
export const createQueueProcessor = (opts: CreateQueueProcessorOpts) => {
  const redisClient = opts.redisClient;
  const localQueue = new Queue(1);

  const sub = redisClient.duplicate();
  sub.connect();

  sub.subscribe("mq", async (message) => {
    const payload = JSON.parse(message) as Event;

    localQueue.run(async () => {
      if (payload.event === "add") {
        const activeKey = makeKey(
          "mq",
          payload.name,
          payload.groupName,
          "active"
        );
        const waitKey = makeKey("mq", payload.name, payload.groupName, "wait");

        const activeEntriesLength = await redisClient.lLen(activeKey);
        if (activeEntriesLength) {
          return;
        }

        await redisClient.lRem(waitKey, 1, payload.id);

        await redisClient.rPush(activeKey, payload.id);

        await redisClient.publish(
          "mq",
          JSON.stringify({ ...payload, event: "start" } as StartEvent)
        );
      }

      if (payload.event === "finish") {
        const activeKey = makeKey(
          "mq",
          payload.name,
          payload.groupName,
          "active"
        );
        await redisClient.lRem(activeKey, 1, payload.id);

        const waitKey = makeKey("mq", payload.name, payload.groupName, "wait");

        const firstWaitingId = await redisClient.lPop(waitKey);

        if (firstWaitingId) {
          await redisClient.rPush(activeKey, firstWaitingId);
          await redisClient.publish(
            "mq",
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
