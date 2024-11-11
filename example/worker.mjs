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



queue.add(async() => {
  await setTimeout(1000)
  throw new Error("Fudge")
}, {groupName: "1.1.1"}).catch((err) => {
  console.log(err)
})

const status = await queue.add(async() => {
  await setTimeout(1000)
  return "done"
}, {groupName: "1.1.1"})

console.log(status)