import { createClient } from "redis";
import { AltQueue, handleTimeout } from "./dist/index.mjs";
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();
await redisClient.flushAll();

handleTimeout({
  redisClient,
});

const queue = new AltQueue({
  redisClient,
  name: "addFriend",
});

async function doSomething(groupName) {
  const done = await queue.start({ groupName });
  console.log("doing something");
  await setTimeout(1000);
  // done();
}

doSomething("123");
doSomething("123");
