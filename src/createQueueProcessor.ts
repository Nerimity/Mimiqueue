import { RedisClient, Event } from "./types";
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

  redisClient.subscribe("mq", (message) => {
    const payload = JSON.parse(message) as Event;
    if (payload.event === "add") {
      const key = makeKey("mq", payload.name, payload.groupName, "active");

      redisClient.sAdd(key, payload.id);
    }
  });
};
