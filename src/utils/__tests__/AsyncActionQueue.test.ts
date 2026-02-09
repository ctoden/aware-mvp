import { AsyncActionQueue } from '../AsyncActionQueue';
import { Ok, Err } from 'neverthrow';
import { sleep } from '../PromiseUtils';

jest.useFakeTimers();

// Dummy functions
const asyncFunction1 = () =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1000));
const asyncFunction2 = () => new Promise<boolean>((_, reject) => setTimeout(() => reject(), 1000));
const asyncFunction3 = () =>
  new Promise<boolean>((_, reject) => setTimeout(() => reject('Test Error'), 1000));

describe('AsyncActionQueue class', () => {
  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  
  test('should execute given async actions', async () => {
    const queue = new AsyncActionQueue(3);

    const promise1 = queue.executeAction(asyncFunction1);
    const promise2 = queue.executeAction(asyncFunction2);

    jest.runAllTimers();

    const result1: Ok<boolean, Error> = (await promise1) as Ok<boolean, Error>;
    const result2: Err<boolean, Error> = (await promise2) as Err<boolean, Error>;

    expect(result1.isOk()).toBeTruthy();
    expect(result2.isErr()).toBeTruthy();
    expect(result1.value).toEqual(true);
    expect(result2.error).toBeTruthy();
  });

  test('should handle rejection by returning an Error Result', async () => {
    const queue = new AsyncActionQueue(3);
    const promise = queue.executeAction(asyncFunction3);
    jest.runAllTimers();

    const error = (await promise) as Err<boolean, Error>;
    expect(error.isOk()).toBeFalsy();
    expect(error.isErr()).toBeTruthy();
    expect(error.error).toEqual('Test Error');
  });

  test('runningActions getter should return the correct number of running actions', () => {
    const queue = new AsyncActionQueue(3);
    queue.executeAction(asyncFunction1);
    queue.executeAction(asyncFunction1);

    jest.runAllTimers();
    expect(queue.runningActions).toBe(2);
  });

  test('hasActiveAsyncActions getter should return whether any async actions are active or not', async () => {
    jest.useRealTimers();
    const queue = new AsyncActionQueue(3);
    const r = queue.executeAction(asyncFunction1);
    expect(queue.hasActiveAsyncActions).toBe(true);
    await r;
    await sleep(100);
    expect(queue.hasActiveAsyncActions).toBe(false);
  });
});
