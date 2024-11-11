import { AddEvent, Event, FinishEvent, RedisClient } from "./types";
import { makeKey } from "./utils";
import { setTimeout } from "timers/promises";
interface createQueueOpts<T = () => any> {
  redisClient: RedisClient;
  name: string;
  globalMinTime?: number;
}

interface AddOpts {
  groupName?: string;
  minTime?: number;
}

interface WaitList {
  func: () => Promise<any>;
  minTime?: number;
}

const generateId = async (redisClient: RedisClient, name?: string) => {
  const id = await redisClient.incr(`mq:${name}:count`);
  return id.toString();
};

export const createQueue = (opts: createQueueOpts) => {
  const localWaitList = new Map<string, WaitList>();

  const sub = opts.redisClient.duplicate();
  sub.connect();

  sub.subscribe("mq", async (message) => {
    const payload = JSON.parse(message) as Event;
    if (payload.name !== opts.name) {
      return;
    }
    if (payload.event === "start") {
      const waitListItem = localWaitList.get(payload.id);
      if (waitListItem) {
        const minTime = waitListItem.minTime ?? opts.globalMinTime;
        if (minTime) {
          await setTimeout(minTime);
        }
        waitListItem.func().finally(() => {
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
      localWaitList.set(id.toString(), {
        func: async () => resolve(await func().catch(reject)),
        minTime: addOpts?.minTime,
      });
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
