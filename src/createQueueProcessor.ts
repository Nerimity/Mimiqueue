import { RedisClient } from "./types";

interface CreateQueueProcessorOpts {
  redisClient: RedisClient;
}
/**
 *  This function should be ran in the main thread.
 *
 */
export const createQueueProcessor = (opts: CreateQueueProcessorOpts) => {
  const redisClient = opts.redisClient;
  redisClient.pSubscribe("mq:*", (channel, message) => {});
};
