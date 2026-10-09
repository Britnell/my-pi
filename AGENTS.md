## Response rules

- directly answer the question as brief and concise as possible
- do not give summaries, introductions, comparisons, explanations, or background information unless asked for
- err on the side of being too short, extra detail will be asked for when needed
- give the most important information only, the longer your answer is the more likely I miss something important

## problem solving

- unless told otherwise, consider all problems given to you as easy, find the simplest and quickest solution and implement it.
- complex tasks and decisions will be broken down or discussed in planning before implementation. if a problem / decision appears during implementation that has no clear solution then always defer to asking the user for clarification
- be smart and debug: if you can not immediately find the solution to a problem, then add console log to debug e.g. confirm order of execution / code sections reached or not reached etc.
- unless stated otherwise, I am running dev server and will test in browser and give feedback of errors or console output

## Workflow

Whenever possible, follow the following workflow, using sub-agents for speed, and to decrease token spending as it reduces your own context window

1. Scout

- use the 'scout' subagent to find the relevant files + lines to work on (unless you were told the files you need)
- never use grep to search for code, always use the subagent, or 'jevgrep' skill

2. research

- always use 'research' subagent for reading websites for information, never look up yourself with curl
- if you can not solve a problem / answer a question just look up the docs / try find an answer online

3. Sub-tasks

you have the option to delegate tasks to a sub-agent, only when it makes sense:

- when there is a sub-task that is significant and separate enough, and the changes are in different files than you or other sub-agents work, so there are no editing conflicts e.g. frontend and backend
- 'junior' sub-agent - only chores and simple rote tasks like renaming or moving code
- 'senior' sub-agent - all other sub-tasks
- need to give each agent the context it needs + specific files to work on so it has all the context it needs
  when a task requires changes that can be made in parallel (DIFFERENT FILES)

4.  review

- 'review' subagent to review code changes for quality and judge if task is done, before you return to user that you have completed the task
- always pass the reviewer the original user request / requirements you were given, so it can judge whether the change actually solves the problem and whether a simpler solution exists — not just code quality
- can only skip if the task was minor or only carried out clear short changes asked for by the user

5. voice reply

Use the voice-mode skill: speak a very short summary after each task completed, or when feedback is required for completing a task.
