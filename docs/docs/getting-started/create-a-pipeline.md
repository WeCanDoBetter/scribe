---
sidebar_position: 3
---

# Create a Pipeline

In this example, we will guide you through the process of creating and running a Pipeline
using Scribe.

## Importing Modules

The first step is to import the necessary modules. Here we need the `Pipeline` module to create
our Pipeline and `runWorkflow` to run it.

```ts
import { Pipeline } from "https://deno.land/x/scribeai/lib/Pipeline.ts";
import { runWorkflow } from "https://deno.land/x/scribeai/util.ts";
```

## Creating a Pipeline

Next, we create a new instance of a Pipeline. We specify an object that can contain options
for the pipeline. In this case, we define `ops`, which stands for
[operations](/core-concepts/workflows#operations), where each operation is a workflow itself.
Here, two dummy tasks are set up for `push` and `runFor`.

```ts
const myPipeline = new Pipeline<MyCtx>({
  ops: {
    push: async (_ctx, next) => {
      await next();
    },
    runFor: async (_ctx, next) => {
      await next();
    },
  },
});
```

## Adding Workflows to the Pipeline

The `push` method is used to add workflows into the Pipeline. The workflows can be tasks,
other pipelines, or even graphs. In this case, we're adding a simple task that calls the `next` function.

```ts
await myPipeline.push(
  async (_ctx, next) => {
    await next();
  },
);
```

## Running the Pipeline

Finally, the `runWorkflow` function is used to execute the Pipeline.
The Pipeline `myPipeline` and the context `ctx` are passed as arguments.

```ts
await runWorkflow(myPipeline, ctx);
```

Upon running this code, the Pipeline will execute each added workflow (tasks, pipelines,
or graphs) in the order they were added. Since the example Pipeline has only one task
that merely calls the `next` function, there will be no observable changes in the context.
However, in more complex scenarios, each workflow within the Pipeline could potentially
modify the context or carry out specific operations, thereby orchestrating a sequence of actions.

## The Complete Example

```ts
import { Pipeline } from "https://deno.land/x/scribeai/lib/Pipeline.ts";
import { runWorkflow } from "https://deno.land/x/scribeai/util.ts";

interface MyCtx {
  counter: number;
}

const myPipeline = new Pipeline<MyCtx>({
  ops: {
    // Set up a dummy push operation workflow (a Task in this case)
    push: async (_ctx, next) => {
      await next();
    },
    // Set up a dummy runFor operation workflow (a Task in this case)
    runFor: async (_ctx, next) => {
      await next();
    },
  },
});

const ctx: MyCtx = { counter: 0 };

// Add one or more workflows to the pipeline
await myPipeline.push(
  async (_ctx, next) => {
    await next();
  },
);

// Run the pipeline
await runWorkflow(myPipeline, ctx);
```