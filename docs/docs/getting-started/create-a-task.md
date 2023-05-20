---
sidebar_position: 2
---

# Create a Task

In this example, we're showing how to create and run a simple Task in Scribe.

## Importing Modules

We begin by importing the necessary modules.
`Task` is the base type for all Scribe tasks, and `runWorkflow` is a utility
function that allows us to execute a Task or a more complex workflow.

```ts
import type { Task } from "https://deno.land/x/scribeai/types.ts";
import { runWorkflow } from "https://deno.land/x/scribeai/util.ts";
```

## Creating the Context Interface

The context interface `MyCtx` is defined with a `counter` property.
The context carries the state data that can be shared and manipulated across different tasks in the workflow.

```ts
interface MyCtx {
  counter: number;
}
```

## Initializing the Context

The `ctx` object, an instance of `MyCtx`, is created and initialized.
Here, the `counter` is initially set to 0.

```ts
const ctx: MyCtx = { counter: 0 };
```

## Defining the Task

A new Task function `myTask` is created. The Task takes in the context and a `next` function.
The `next` function is used to signal the completion of the current task and initiate the next one.
Within this task, we increment the `counter` in the context, first in the forward pass before calling `next()`,
and then in the backward pass after the `next()` call.

```ts
const myTask: Task<MyCtx> = async (ctx, next) => {
  ctx.counter++;
  await next();
  ctx.counter++;
};
```

## Running the Task

Finally, we run the task using the `runWorkflow` function. We pass in the `myTask` function,
the context `ctx`, and an optional tail function. The tail function is called after all tasks have completed their forward pass.
Here, it logs the current value of `counter`.

```ts
await runWorkflow(myTask, ctx, () => {
  console.log(`Counter is now ${ctx.counter}`);
  return Promise.resolve();
});
```

Once the task has been run, the final value of `counter` in the context is logged,
demonstrating the changes made to the context during the execution of the task.

```ts
console.log(`Counter is now ${ctx.counter}`);
```

By the end of this process, the `counter` in the context should have been incremented twice,
once during the forward pass and once during the backward pass, demonstrating how Tasks can
manipulate the shared context.

## The Complete Example

```ts
import type { Task } from "https://deno.land/x/scribeai/types.ts";
import { runWorkflow } from "https://deno.land/x/scribeai/util.ts";

interface MyCtx {
  counter: number;
}

const ctx: MyCtx = { counter: 0 };

const myTask: Task<MyCtx> = async (ctx, next) => {
  ctx.counter++;
  await next();
  ctx.counter++;
};

await runWorkflow(myTask, ctx, () => {
  console.log(`Counter is now ${ctx.counter}`);
  return Promise.resolve();
});

console.log(`Counter is now ${ctx.counter}`);
```

Output:

```
Counter is now 1
Counter is now 2
```