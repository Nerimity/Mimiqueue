# Mimiqueue

### Features

- Cluster Support
- Redis Required
- Group Queuing
- Throttle Support (minTime)

### Installation

```
pnpm i redis @nerimity/mimiqueue
```

### Usage

```ts
import { createQueue, createQueueProcessor } from "@nerimity/mimiqueue";
import { createClient } from "redis";
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

const main = async () => {
  await redisClient.connect();

  // NOTE:
  // When running in a cluster, this needs to be ran ONCE in the main thread.
  await createQueueProcessor({
    redisClient,
  });

  const queue = await createQueue({
    name: "test-queue",
    redisClient,
    minTime: 1000,
  });

  queue.add(
    async () => {
      await setTimeout(5000);
      return "done";
    },
    { groupName: "someId eg ip address" }
  );

  const status = await queue.add(
    async () => {
      await setTimeout(5000);
      return "done";
    },
    { groupName: "someId eg ip address" }
  );

  console.log(status);
};

main();
```
