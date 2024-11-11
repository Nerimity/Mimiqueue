import { createQueue } from "../dist/index.mjs";
import {createClient} from 'redis'
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();


const queue =  createQueue({
  name: "test-queue",
  redisClient,
  minTime: 1000
})


  for (let index = 0; index < 4; index++) {
    const status =  queue.add(async() => {
      await setTimeout(5000);
      console.log("done", index)
      return "done"
    }, {groupName: "1.1.1" + Math.random()})
  }