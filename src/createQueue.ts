import { RedisClient } from "./types";

interface createQueueOpts<T = () => any> {
  redisClient: RedisClient;
  name: string;
}

interface AddOpts {
  groupName?: string;
}

export const createQueue = (opts: createQueueOpts) => {
  const add = async <T extends () => any>(
    func: T,
    opts?: AddOpts
  ): Promise<Awaited<ReturnType<T>>> => {
    return func();
  };

  return {
    add,
  };
};
