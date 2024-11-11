import { AddEvent, Event, FinishEvent, RedisClient } from "./types";
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
  const localWaitList = new Map<string, () => Promise<any>>();

  const sub = opts.redisClient.duplicate();
  sub.connect();

  sub.subscribe("mq", (message) => {
    const payload = JSON.parse(message) as Event;
    if (payload.name !== opts.name) {
      return;
    }
    if (payload.event === "start") {
      const func = localWaitList.get(payload.id);
      if (func) {
        func().finally(() => {
          opts.redisClient.publish(
            "mq",
            JSON.stringify({ ...payload, event: "finish" } as FinishEvent)
          );
        });
        localWaitList.delete(payload.id);
      }
    }
  });

  const add = async <T extends () => any>(func: T, addOpts?: AddOpts) => {
    const id = await generateId(opts.redisClient, opts.name);

    await opts.redisClient.rPush(
      makeKey("mq", opts.name, addOpts?.groupName, "wait"),
      id
    );

    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      localWaitList.set(id.toString(), async () =>
        resolve(await func().catch(reject))
      );
      opts.redisClient.publish(
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
