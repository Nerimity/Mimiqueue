import { createClient } from "redis";
import { createQueueProcessor } from "../dist/index.mjs";
import cluster from "cluster";

if (cluster.isPrimary) {
  const redisClient = createClient({
    socket: {
      host: "127.0.0.1",
      port: 6379,
    },
  });
  await redisClient.connect();

  await createQueueProcessor({
    redisClient,
  });

  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  import("./worker.mjs");
}
