import { createClient } from "redis";
import { Queue as MemoryQueue } from "async-await-queue";

type RedisClient = ReturnType<typeof createClient>;

interface QueueOpts<T> {
  name: string;
  redisClient: RedisClient;
  process: T;
}
export class Queue<
  T extends (data: any) => Promise<any> = (data: any) => Promise<any>
> {
  addQueue = new MemoryQueue(1);

  redisClient: RedisClient;
  name: string;
  prefix = "mimiqueue";
  ids: Map<string, [any, any]> = new Map();
  sub: RedisClient;
  processFn: T;
  constructor(opts: QueueOpts<T>) {
    this.processFn = opts.process;
    this.name = opts.name;
    this.redisClient = opts.redisClient;
    this.sub = this.redisClient.duplicate();
    this.sub.connect();

    this.sub.subscribe("mimiqueue", async (message) => {
      const payload = JSON.parse(message) as [
        "start" | "finish" | "remove",
        string,
        string,
        string
      ]; // [action, name, id, groupName?]

      if (payload[0] === "start") {
        this.startJob(payload[1], payload[2], payload[3]);
      }

      if (payload[0] === "remove") {
        if (this.name !== payload[1]) return;
        this.ids.delete(payload[2]);
      }

      if (payload[0] === "finish") {
        if (this.name !== payload[1]) return;
        if (!this.ids.delete(payload[2])) return;

        const latestJob = await getAndMoveLatestWaitingJobToActive(
          this,
          payload[3]
        );
        if (!latestJob) return;
        const newPayload = JSON.stringify([
          "start",
          this.name,
          latestJob.id,
          payload[3],
        ]);
        this.redisClient.publish("mimiqueue", newPayload);
      }
    });
  }

  private async startJob(name: string, id: string, groupName?: string) {
    if (name !== this.name) return;
    const cb = this.ids.get(id);
    if (!cb) return;

    const job = await getJobById(this, id, groupName);
    const data = JSON.parse(job.data || "null");
    await this.processFn(data)
      .then((result: any) => {
        return cb[0](result);
      })
      .catch((e: any) => {
        return cb[1](e);
      });

    await removeActiveJob(this, id, groupName);
    this.redisClient.publish(
      "mimiqueue",
      JSON.stringify(["finish", name, id, groupName])
    );
  }
  async add(data: any, opts?: { groupName?: string }) {
    const id = await this.addQueue.run(async () => {
      const id = await addJob(this, data, opts?.groupName);

      const hasActiveOrWaitingJobs = await activeOrWaitingJobCount(
        this,
        opts?.groupName
      );
      if (hasActiveOrWaitingJobs) {
        await addJobToWaiting(this, id, opts?.groupName);
      }

      if (!hasActiveOrWaitingJobs) {
        await addJobToActive(this, id, opts?.groupName);
        const payload = JSON.stringify([
          "start",
          this.name,
          id.toString(),
          opts?.groupName,
        ]);
        this.redisClient.publish("mimiqueue", payload);
      }
      return id;
    });

    return new Promise((resolve, reject) => {
      this.ids.set(id.toString(), [resolve, reject]);
    });
  }
}

async function genId(queue: Queue) {
  return await queue.redisClient.incr(`${queue.prefix}:${queue.name}:id`);
}

async function addJob<T>(queue: Queue, data: T, groupName?: string) {
  const id = await genId(queue);

  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;
  key += `:${id}`;

  await queue.redisClient.hSet(key, {
    data: JSON.stringify(data),
    createdAt: Date.now(),
  });

  return id;
}

function addJobToWaiting(queue: Queue, id: number, groupName?: string) {
  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;
  key += ":wait";

  return queue.redisClient.rPush(key, id.toString());
}

function addJobToActive(queue: Queue, id: number | string, groupName?: string) {
  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;
  key += ":active";

  return queue.redisClient.set(key, id.toString());
}

async function activeOrWaitingJobCount(queue: Queue, groupName?: string) {
  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;

  const multi = queue.redisClient.multi();
  multi.get(`${key}:active`);
  multi.lLen(`${key}:wait`);

  const [active, wait] = (await multi.exec()) as [number, number];

  return (active ? 1 : 0) + wait;
}

async function getJobById(queue: Queue, id: string, groupName?: string) {
  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;

  return queue.redisClient.hGetAll(`${key}:${id.toString()}`);
}
async function removeActiveJob(queue: Queue, id: string, groupName?: string) {
  let key1 = `${queue.prefix}:${queue.name}`;
  if (groupName) key1 += `:${groupName}`;
  key1 += ":active";

  let key2 = `${queue.prefix}:${queue.name}`;
  if (groupName) key2 += `:${groupName}`;
  key2 += `:${id}`;
  const multi = queue.redisClient.multi();

  multi.del(key1);
  multi.del(key2);

  return multi.exec();
}

async function removeWaitingJob(queue: Queue, id: string, groupName?: string) {
  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;
  key += ":wait";
  return queue.redisClient.lRem(key, 1, id.toString());
}

async function getAndMoveLatestWaitingJobToActive(
  queue: Queue,
  groupName?: string
) {
  let key = `${queue.prefix}:${queue.name}`;
  if (groupName) key += `:${groupName}`;
  key += ":wait";
  const id = await queue.redisClient.lIndex(key, 0);
  if (!id) return null;
  const activeJob = getJobById(queue, id, groupName);
  if (!activeJob) return null;

  await removeWaitingJob(queue, id, groupName);
  await addJobToActive(queue, id, groupName);
  return { job: activeJob, id };
}
