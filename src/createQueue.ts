import {
  AddEvent,
  Event,
  FinishEvent,
  OptionsEvent,
  RedisClient,
} from "./types";
import { makeKey } from "./utils";
interface createQueueOpts<T = () => any> {
  prefix?: string;
  redisClient: RedisClient;
  name: string;
  minTime?: number;
}

interface AddOpts {
  groupName?: string;
  id?: string;
}

interface WaitList {
  func: () => Promise<any>;
}

const generateId = async (
  redisClient: RedisClient,
  name?: string,
  prefix?: string
) => {
  const id = await redisClient.incr(makeKey(`mq${prefix}`, name, "count"));
  return id.toString();
};

export const createQueue = (opts: createQueueOpts) => {
  if (opts.prefix) {
    opts.prefix = `-${opts.prefix}`;
  } else {
    opts.prefix = "";
  }
  const localWaitList = new Map<string, WaitList>();

  const genId = async () => {
    return await generateId(opts.redisClient, opts.name);
  };

  const getQueuePosition = async (id: string, groupName?: string) => {
    return await opts.redisClient.lPos(
      makeKey(`mq${opts.prefix}`, opts.name, groupName, "wait"),
      id
    );
  };

  const pub = opts.redisClient.duplicate();
  const sub = opts.redisClient.duplicate();
  sub.connect();
  pub.connect().then(() => {
    opts.redisClient.publish(
      `mq${opts.prefix}`,
      JSON.stringify({
        event: "options",
        name: opts.name,
        minTime: opts.minTime,
      } as OptionsEvent)
    );
  });

  sub.subscribe(`mq${opts.prefix}`, async (message) => {
    const payload = JSON.parse(message) as Event;
    if (payload.name !== opts.name) {
      return;
    }
    if (payload.event === "start") {
      const waitListItem = localWaitList.get(payload.id);
      if (waitListItem) {
        waitListItem.func().finally(() => {
          opts.redisClient.publish(
            `mq${opts.prefix}`,
            JSON.stringify({ ...payload, event: "finish" } as FinishEvent)
          );
        });
        localWaitList.delete(payload.id);
      }
    }
  });

  const add = async <T extends () => any>(func: T, addOpts?: AddOpts) => {
    const id = addOpts?.id || (await genId());

    await opts.redisClient.rPush(
      makeKey(`mq${opts.prefix}`, opts.name, addOpts?.groupName, "wait"),
      id
    );

    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      localWaitList.set(id.toString(), {
        func: async () => resolve(await func().catch(reject)),
      });
      opts.redisClient.publish(
        `mq${opts.prefix}`,
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
    genId,
    getQueuePosition,
  };
};
