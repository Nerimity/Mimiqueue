import { createQueueProcessor } from "../dist/index.mjs";
import cluster from "cluster";

import { Redis } from "ioredis";

if (cluster.isPrimary) {
  const ioRedisClient = new Redis({
    host: "127.0.0.1",
    port: 6379,
  });

  await createQueueProcessor({
    redisClient: ioRedisClient,
  });

  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  import("./worker.mjs");
}
