import { createQueue } from "../dist/index.mjs";
import { setTimeout } from "timers/promises";

const queue = createQueue({
  redisClient,
})


const test = queue.add(async() => {
  await setTimeout(1000);
  return true;
});
