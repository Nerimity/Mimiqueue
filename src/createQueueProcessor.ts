import { RedisClient, Event } from "./types";

interface CreateQueueProcessorOpts {
  redisClient: RedisClient;
}
/**
 *  This function should be ran in the main thread.
 *
 */
export const createQueueProcessor = (opts: CreateQueueProcessorOpts) => {
  const redisClient = opts.redisClient;
  redisClient.subscribe("mq", ( message) => {
    const data = JSON.parse(message) as Event;
    
  });
};
