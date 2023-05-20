---
sidebar_position: 1
---

# Workflows

## What are Workflows?

Workflows form the backbone of Scribe, defining the sequence and logic of
operations that transform and process data. They are modular, scalable, and can
be combined to create complex systems while keeping the code maintainable and
organized.

## Supported Workflows

### Tasks

Tasks are the fundamental building blocks of workflows in Scribe. They
encapsulate individual operations as simple asynchronous functions, which can be
plugged together to build up complex behavior.

The inherent simplicity of tasks belies their versatility and power in composing
robust and complex workflows. A task can perform any operation that can be
encapsulated within an asynchronous function. This could range from data
transformation, calling APIs, interacting with databases, or even making
decisions based on the task's internal logic or the shared context of the
workflow.

Tasks offer a granular approach to constructing workflows, allowing for clear
division of responsibilities, easier testing, and improved code maintainability.
Their modularity also promotes code reuse, as tasks can be used across different
workflows, reducing redundancy and enhancing scalability in your applications.

[Read more about Tasks](./tasks.md)

### Pipelines

Pipelines build upon the foundational concept of tasks, extending their
functionality to create a linear sequence of workflows. These workflows can be
individual tasks, other pipelines, or even graphs, creating an elaborate chain
of operations. Pipelines are particularly suited for scenarios that necessitate
a linear, sequential logic in data processing, where data is meticulously guided
from the pipeline's initiation to its termination.

Pipelines bring to the forefront a clear visualization of the data flow,
contributing significantly to the transparency and readability of the code. This
aspect of pipelines is not just valuable for debugging and understanding the
workflow's behavior, but it also aids in communicating the system's architecture
and logic to other developers or stakeholders.

Pipelines act as a scaffolding for constructing more intricate systems by
aggregating smaller workflows. This capability promotes modularity and
reusability in your application design, as pipelines can be nested within each
other or combined to create larger, more complex workflows. The seamless joining
of smaller workflows allows for compartmentalization of functionality, making it
easier to understand, maintain, and scale your application.

[Read more about Pipelines](./pipelines.md)

### Graphs

Graphs represent a leap towards complexity, embodying intricate workflows
modeled as
[Directed Acyclic Graphs (DAGs)](https://en.wikipedia.org/wiki/Directed_acyclic_graph).
Each node in the graph is akin to a versatile tool capable of executing a wide
range of functionality, while the edges meticulously map out the sequence of
execution. This design allows graphs to accommodate complex, conditional
workflow logic that transcends the capabilities of linear pipelines, offering a
more nuanced approach to data processing.

One of the primary strengths of graphs is their immense flexibility. Unlike
linear pipelines, which proceed in a singular direction, graphs provide the
liberty to define workflows with multiple predecessors and successors. This
results in a mesh of interconnected tasks, each branching out or merging based
on the defined logic. This architecture permits the construction of intricate
workflows that can adapt to diverse requirements, enabling developers to craft
solutions that cater to complex, multi-faceted problems.

By harnessing the power of graphs, developers can model workflows that are as
complex as they are efficient, extending the boundaries of what can be achieved
with Scribe.

[Read more about Graphs](./graphs.md)

## Execution Flow

The execution flow of tasks in Scribe is a crucial concept to understand, as it
governs the sequence of operations in workflows. It can be broken down into two
distinct phases: the forward pass and the backward pass. This dual-phase
execution provides a powerful mechanism to control the behavior of your
workflows and how data is processed and manipulated.

### Forward Pass

The forward pass represents the first half of a task's life cycle. Here, tasks
are executed in the order they appear from the start to the end of the pipeline.
Each task in the sequence is invoked with its operation logic until the `next()`
function is called. The `next()` function acts as a pivot point, signaling the
completion of the current task's forward pass and triggering the initiation of
the next task's forward pass.

This process continues until it reaches the end of the pipeline, providing an
efficient and orderly way to process data and operations. The context passed to
each task during the forward pass carries state and data that can be shared
across tasks, allowing communication and data transfer between them.

### Backward Pass

Once the forward pass reaches the end of the pipeline, the backward pass begins,
signifying the second half of the task's life cycle. The backward pass moves in
the opposite direction, from the end of the pipeline back to its start. It
resumes the execution of tasks at the point they were paused by the `next()`
function during the forward pass.

The backward pass gives tasks a chance to perform clean-up operations, finalize
computations, or perform any other operations that should happen after all
subsequent tasks have completed their forward pass. It's a perfect place for
operations like committing a database transaction, closing file handles, sending
finalizing notifications, etc.

Understanding the forward and backward pass model allows for effective control
over data processing and enhances the capabilities of your workflows in handling
complex situations. This two-pass system is one of the distinguishing features
of Scribe's execution flow, adding a layer of depth and versatility to how tasks
are processed in a workflow.

## Operations

In Scribe, operations define the actions a component can perform. These operations are essentially workflows themselves, giving you the flexibility to customize their behavior and control their execution sequence. This unique feature is what we call being "workflow-enabled".

An operation is primarily responsible for performing a particular action or functionality of a component. For instance, a Pipeline has a `push` operation which is responsible for adding workflows to the pipeline, or a `runFor` operation which executes the workflow for the given context.

Operations are highly configurable and allow you to define custom workflows for each operation. Each operation's workflow is a sequence of tasks, with the tail performing the core operation. However, the unique feature of these workflows is that you can add other tasks before the tail function, providing a layer of control before the operation's execution.

Currently, you must provide operation workflows explicitly:

```ts
const myPipeline = new Pipeline({
  // Operations are defined using the `ops` option
  ops: {
    // Set up a dummy push operation workflow (a Task in this case)
    // This operation is executed each time you `push` a workflow into this pipeline
    push: async (_ctx, next) => {
      await next();
    },
    // Set up a dummy runFor operation workflow (a Task in this case)
    // This operation is executed each time the pipeline is run
    runFor: async (_ctx, next) => {
      await next();
    },
  },
});
```

This ability to augment operations with their own workflows allows developers to introduce additional logic, such as validation, logging, transformation, and even cancellation, before the actual operation takes place. This extends the flexibility of Scribe, allowing the developer to modify the standard behavior of operations to suit their application's unique requirements.

Embedding workflows into operations epitomizes Scribe's commitment to flexibility, customization, and control, providing developers with a rich, adaptable, and robust tool for crafting intricate and tailored workflows.
