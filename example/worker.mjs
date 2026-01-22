import { createQueue } from "../dist/index.mjs";
// import { createClient } from "redis";
import { setTimeout } from "timers/promises";

import { Redis } from "ioredis";

const redisClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
  lazyConnect: true,
});

await redisClient.connect();

const queue = createQueue({
  name: "test-queue",
  redisClient,
  minTime: 1000,
});

for (let index = 0; index < 4; index++) {
  const status = queue.add(
    async () => {
      await setTimeout(5000);
      console.log("done", index);
      return "done";
    },
    { groupName: "1.1.1" + Math.random() },
  );
}
