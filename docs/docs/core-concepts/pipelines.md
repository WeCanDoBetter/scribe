---
sidebar_position: 3
---

# Pipelines

A Pipeline is a form of workflow, defined as a linear sequence of other
workflows - which could be [Tasks](./tasks.md), other Pipelines, or
[Graphs](./graphs.md). The pipeline structure is ideal for situations where data
processing needs to occur in a straightforward, unidirectional manner, moving
from the start to the end of the pipeline without any loops or conditional
paths.

In Scribe, each component of the pipeline, be it a task, another pipeline, or a
graph, has the ability to modify the context properties. The context is a shared
object that is passed from one workflow to the next, allowing workflows to
communicate and pass data to each other.

## Example

Following the definition of the pipeline, a new task is added to the pipeline
using the `push` method. This task does not modify the context, but in a
real-world scenario, tasks can manipulate the context, perform operations, call
APIs, etc.

Finally, the `runWorkflow` function is used to execute the pipeline, initiating
the forward pass and eventually the backward pass of the pipeline's workflows.

```ts
import { Pipeline, runWorkflow } from "https://deno.land/x/scribeai/mod.ts";

const myPipeline = new Pipeline<MyCtx>({
  name: "My Pipeline",
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

// Add one or more workflows to the pipeline
await myPipeline.push(
  async (_ctx, next) => {
    await next();
  },
);

// Run the pipeline
await runWorkflow(myPipeline, ctx);
```

The pipeline workflow provides a clean, organized way to manage linear
workflows, making it easier to understand the sequence of operations, debug the
code, and extend the pipeline with new workflows. It also ensures that all
workflows in the pipeline have access to a shared context, simplifying the data
passing between different parts of the workflow.
