import { createClient } from "redis";
import { Queue } from "./dist/index.mjs";
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();
await redisClient.flushAll();

const addFriendQueue = new Queue({
  redisClient,
  name: "addFriend",
  process: async (data) => {
    await setTimeout(2000);
    return { done: "lol", data };
  },
});

addFriendQueue.add({ someData: 1 }, { groupName: "1234" }).then((res) => {
  console.log(res);
});

addFriendQueue.add({ someData: 2 }, { groupName: "1234" }).then((res) => {
  console.log(res);
});

addFriendQueue.add({ someData: 3 }, { groupName: "1234" }).then((res) => {
  console.log(res);
});
