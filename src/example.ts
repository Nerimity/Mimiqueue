import { createClient } from "redis";
import { Queue } from "./index";
import { setTimeout } from "timers/promises";
import { workerData } from "worker_threads";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();
// await redisClient.flushAll();

const queue = new Queue({
  name: "add-friend-queue",
  redisClient: redisClient,
  process: async (data) => {
    await setTimeout(2000);

    return { done: "lol", data };
  },
});

queue.add(1, { groupName: "1234" }).then((res) => {
  console.log("1234");
});
queue.add(1, { groupName: "1234" }).then((res) => {
  console.log("1234");
});

queue.add(1, { groupName: "543" }).then((res) => {
  console.log("543");
});
queue.add(1, { groupName: "543" }).then((res) => {
  console.log("543");
});

queue.add(1).then((res) => {
  console.log("no");
});
queue.add(1).then((res) => {
  console.log("no");
});
