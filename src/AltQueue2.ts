import { AltQueue, AltQueueOpts } from "./AltQueue";

export class AltQueue2 {
  private _altQueue: AltQueue;
  constructor(opts: AltQueueOpts) {
    this._altQueue = new AltQueue(opts);
  }
  async add(cb: () => Promise<void>, opts: { groupName?: string }) {
    const finish = await this._altQueue.start(opts);

    cb()
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        finish();
      });
  }
}
