import { createQueue } from "../dist/index.mjs";
import { setTimeout } from "timers/promises";
import {createClient} from 'redis'

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();


const queue = createQueue({
  name: "test-queue",
  redisClient,
})


const test = queue.add(async() => {
  await setTimeout(1000);
  return true;
}, {groupName: "test"});
const test2 = queue.add(async() => {
  await setTimeout(1000);
  return true;
}, {groupName: "test"});
