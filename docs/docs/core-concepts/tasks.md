---
sidebar_position: 2
---

# Tasks

In Scribe, tasks are the fundamental building blocks of workflows and are
essentially simple asynchronous functions. They provide a systematic approach to
creating workflows, where each task executes a specific function in the
pipeline. If you've worked with Express or Koa, the task middleware in Scribe
will feel very familiar.

## Example

We begin by importing the necessary elements from the Scribe library - `Task`
from `types.ts` and `runWorkflow` from `util.ts`. The `Task` type is an
asynchronous function that acts as middleware, while `runWorkflow` is a utility
function used to execute our workflows.

```ts
import type { Task } from "https://deno.land/x/scribeai/types.ts";
import { runWorkflow } from "https://deno.land/x/scribeai/util.ts";
```

We define a task named `myTask`. This task function receives two parameters -
`ctx`, which is the context of the task (an object of type `MyCtx` in this
example), and `next`, a function to signal the completion of the forward pass
and the initiation of the backward pass in the task's execution.

```ts
const myTask: Task<MyCtx> = async (ctx, next) => {
  console.log("This will be executed on the forward pass");
  await next();
  console.log("This will be executed on the backward pass");
};
```

In the task, we have two `console.log` statements. The first statement, "This
will be executed on the forward pass", is executed as the task runs in the
forward pass of the workflow. The `await next();` call then signals the
completion of the forward pass of this task, and the initiation of the forward
pass of the next task (if it exists).

:::info Using `next()` Effectively

Overlooking the call to `next()` in your task would bring your pipeline to a
halt, initiating the backward pass. This lack of awareness might give rise to
peculiar, challenging-to-debug behaviors. A sound practice to follow is to
invariably call `next()`, even when you return instead of awaiting it (provided
that you wish to continue the execution).

:::

In this example, we don't have another task, so the workflow proceeds to a
function that logs "This is the tail". This function serves as the tail of our
workflow. After this tail function, the backward pass of `myTask` is executed,
and the second `console.log` statement, "This will be executed on the backward
pass", is logged to the console.

Finally, we execute this task using `runWorkflow`. We pass in `myTask` as the
workflow to run, provide `ctx` as the context, and define our tail function.

```ts
await runWorkflow(myTask, ctx, () => {
  console.log("This is the tail");
  return Promise.resolve();
});
```

The output of the program displays the sequence of task execution - the forward
pass of the task, the tail function, and then the backward pass of the task.
This example demonstrates the flow of execution in Scribe tasks, with the
forward and backward passes, highlighting how tasks can manage their operations
in this two-pass system:

```
This will be executed on the forward pass
This is the tail
This will be executed on the backward pass
```

This is the complete example code:

```ts
import type { Task } from "https://deno.land/x/scribeai/types.ts";
import { runWorkflow } from "https://deno.land/x/scribeai/util.ts";

// Create an interface for our context
interface MyCtx {
  counter: number;
}

// Create the context
const ctx: MyCtx = { counter: 0 };

// Create a new Task function
const myTask: Task<MyCtx> = async (ctx, next) => {
  console.log("This will be executed on the forward pass");
  await next();
  console.log("This will be executed on the backward pass");
};

// Run the task
await runWorkflow(myTask, ctx, () => {
  console.log("This is the tail");
  return Promise.resolve();
});
```