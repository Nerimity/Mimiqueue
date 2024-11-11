import { AddEvent, RedisClient } from "./types";
import { makeKey } from "./utils";

interface createQueueOpts<T = () => any> {
  redisClient: RedisClient;
  name: string;
}

interface AddOpts {
  groupName?: string;
}

const generateId = async (redisClient: RedisClient, name?: string) => {
  const id = await redisClient.incr(`mq:${name}:count`);
  return id.toString();
};

export const createQueue = (opts: createQueueOpts) => {
  const localWaitList = new Map<string, any>();

  const sub = opts.redisClient.duplicate();
  const pub = opts.redisClient.duplicate();

  sub.subscribe("mq", (message) => {
    console.log(message);
  });

  const add = async <T extends () => any>(func: T, addOpts?: AddOpts) => {
    if (!sub.isOpen) {
      await sub.connect();
    }
    if (!pub.isOpen) {
      await pub.connect();
    }
    const id = await generateId(pub, opts.name);

    await pub.sAdd(makeKey("mq", opts.name, addOpts?.groupName, "wait"), id);

    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      localWaitList.set(id.toString(), () => resolve(func()));
      pub.publish(
        "mq",
        JSON.stringify({
          event: "add",
          name: opts.name,
          groupName: addOpts?.groupName,
          id,
        } as AddEvent)
      );
    });
  };

  return {
    add,
  };
};
