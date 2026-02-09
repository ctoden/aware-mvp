import { err, ok, Result } from 'neverthrow';
import { isNil } from 'lodash';
import { nanoid } from 'nanoid';

export type AsyncActionQueueActionType = (...optional: any[]) => Promise<void | boolean>;

type CurrentAsyncActionType = {
  resolve: (value: PromiseLike<boolean | void> | any | void) => void;
  action: AsyncActionQueueActionType;
  args: any[];
};

type AsyncActionQueueData = {
  activeAsyncActions: Array<CurrentAsyncActionType>;
  runningActions: number;
};

// TODO: make reactive/observable
export class AsyncActionQueue {
  protected data: AsyncActionQueueData;

  constructor(protected maxConcurrentRequests: number, protected name: string = `${nanoid(5)}`) {
    this.data = {
      activeAsyncActions: [],
      runningActions: 0,
    };
  }

  get runningActions(): number {
    return this.data.runningActions;
  }

  /**
   * Gets the maximum number of concurrent actions allowed by the queue
   * @returns The maximum number of concurrent actions
   */
  getMaxConcurrentActions(): number {
    return this.maxConcurrentRequests;
  }

  get hasActiveAsyncActions(): boolean {
    return this.data.activeAsyncActions.length > 0 || this.data.runningActions > 0;
  }

  public queueAction<T extends AsyncActionQueueActionType>(
    action: T,
    ...args: Parameters<T>
  ): Promise<Result<boolean, Error>> {
    return new Promise<Result<boolean, Error>>((resolve) => {
      this.data.activeAsyncActions.push({ resolve, action, args });
    });
  }

  public executeAction<T extends AsyncActionQueueActionType>(
    action: T,
    ...args: Parameters<T>
  ): Promise<Result<boolean, Error>> {
    return new Promise<Result<boolean, Error>>((resolve) => {
      this.data.activeAsyncActions.push({ resolve, action, args });
      this.tryAsyncAction();
    });
  }



  protected tryAsyncAction(): void {
    if (this.data.activeAsyncActions.length === 0) return;

    console.log(`~~~ AsyncActionQueue: ${this.name}: tryAsyncAction`, this.data.runningActions, this.maxConcurrentRequests);
    if (this.data.runningActions < this.maxConcurrentRequests) {
      const actionStuff = this.data.activeAsyncActions.shift();

      if (actionStuff) {
        const { resolve, action, args } = actionStuff;
        ++this.data.runningActions;

        action(...args)
          .then((val) => {
            if (isNil(val)) {
              resolve(ok(true));
            } else {
              resolve(ok(val));
            }
          })
          .catch((error) => {
            if (isNil(error)) {
              resolve(err('Unknown error in ActionQueue'));
            } else {
              resolve(err(error));
            }
          })
          .finally(() => {
            --this.data.runningActions;
            this.tryAsyncAction();
          });
      }
    }
  }
}
