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
  globalMinTime: 333
})


for (let index = 0; index < 5; index++) {

  const status =  queue.add(async() => {
    console.log("done")
    return "done"
  }, {groupName: "1.1.1", minTime: 0})
}