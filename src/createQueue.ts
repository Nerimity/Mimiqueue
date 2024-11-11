import { AddEvent, RedisClient } from "./types";
import { key } from "./utils";

interface createQueueOpts<T = () => any> {
  redisClient: RedisClient;
  name: string;
}

interface AddOpts {
  groupName?: string;
}


const generateId = (redisClient: RedisClient, name?: string) =>  {
  return redisClient.incr(`mq:${name}:count`);
}

export const createQueue = (opts: createQueueOpts) => {

  const localWaitList = new Map<string, any>();

  // opts.redisClient.subscribe("mq:" + opts.name, (channel, message) => {
  //   console.log(message);
  // });

  const add = async <T extends () => any>(
    func: T,
    addOpts?: AddOpts
  ) => {

    const id = await generateId(opts.redisClient, opts.name);
  
    await opts.redisClient.sAdd(
      key("mq", opts.name, addOpts?.groupName, "wait"),
      id.toString(),
    )

    
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      localWaitList.set(id.toString(), () => resolve(func()));
      opts.redisClient.publish("mq", JSON.stringify({
        event: "add",
        name: opts.name,
        groupName: addOpts?.groupName,
        id,
      } as AddEvent));
    })
  };

  return {
    add,
  };
};



