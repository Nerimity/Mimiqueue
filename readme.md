# Mimiqueue

### Installation

```
pnpm i redis @nerimity/mimiqueue
```

### Usage

```ts
import { createClient } from "redis";
import { Queue } from "@nerimity/mimiqueue";
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();
await redisClient.flushAll();

const addFriendQueue = new Queue({
  redisClient,
  name: "addFriend",
  process: async (data) => {
    await setTimeout(2000);
    return { done: "lol", data };
  },
});

addFriendQueue.add({ someData: 1 }, { groupName: "1234" }).then((res) => {
  console.log(res);
});
addFriendQueue.add("hello", { groupName: "1234" }).then((res) => {
  console.log(res);
});
addFriendQueue.add(123).then((res) => {
  console.log(res);
});
```

## Alt Usage

```ts
import { createClient } from "redis";
import { AltQueue } from "@nerimity/mimiqueue";
import { setTimeout } from "timers/promises";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

await redisClient.connect();
await redisClient.flushAll();

const queue = new AltQueue({
  redisClient,
  name: "addFriend",
});

async function doSomething(groupName) {
  const done = await queue.start({ groupName });
  console.log("doing something");
  await setTimeout(1000);
  done();
}

doSomething("123");
doSomething("123");
```

## Alt 2 Usage

```ts
import { createClient } from "redis";
import { AltQueue2 } from "@nerimity/mimiqueue";
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

async function queueDoSomething(groupName) {
  queue.add(() => doSomething(groupName), { groupName });
}

async function doSomething(groupName) {
  console.log("doing something");
  await setTimeout(1000);
}

queueDoSomething("123");
queueDoSomething("123");
```
