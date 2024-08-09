import { createClient } from "redis";
import { AltQueue2 } from "./dist/index.mjs";
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();
await redisClient.flushAll();

const queue = new AltQueue2({
  redisClient,
  name: "addFriend",
});

async function queueAcceptFriendRequest(requesterId) {
  queue.add(() => acceptFriendRequest(requesterId), { groupName: requesterId });
}

async function acceptFriendRequest(requesterId) {
  console.log("doing something with", requesterId);
  await setTimeout(1000);
}

queueAcceptFriendRequest("1234");
queueAcceptFriendRequest("1234");
queueAcceptFriendRequest("123");
