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



const now = performance.now();
await queue.add(async() => {
}, {groupName: "1.1.1"});

const elapsed = performance.now() - now;
console.log(elapsed);
  
  