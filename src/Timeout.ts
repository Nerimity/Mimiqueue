import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

interface HandleTimeoutOpts {
  redisClient: RedisClient;
  /*
   * @default 30000
   */
  duration?: number;
}

const queuedJobs = new Map<string, NodeJS.Timeout>();

export async function handleTimeout(opts: HandleTimeoutOpts) {
  const redisClient = opts.redisClient;
  const sub = redisClient.duplicate();
  await sub.connect();

  sub.subscribe("mimiqueue", async (message) => {
    const payload = JSON.parse(message) as [
      "start" | "finish",
      string,
      string,
      string
    ]; // [action, name, id, groupName?]

    if (payload[0] === "start") {
      const name = payload[1];
      const id = payload[2];

      queuedJobs.set(
        `${name}${id}`,
        setTimeout(() => {
          const newPayload = ["finish", payload[1], payload[2], payload[3]];
          redisClient.publish("mimiqueue", JSON.stringify(newPayload));
        }, opts.duration || 30000)
      );
    }

    if (payload[0] === "finish") {
      const name = payload[1];
      const id = payload[2];
      const timeoutId = queuedJobs.get(`${name}${id}`);
      clearTimeout(timeoutId);
      queuedJobs.delete(`${name}${id}`);
    }
  });
}
