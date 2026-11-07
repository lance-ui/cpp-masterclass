# Engineering Principles

Write the simplest correct code that solves the actual problem, reads like the code around it, and is easy to delete or change later.

## 1. KISS: Keep It Simple
- Choose the most boring solution that works. Plain functions before classes, classes before frameworks, standard library before dependencies.
- One level of abstraction per function. If you need a diagram to explain it, simplify it.
- Prefer flat over nested: return early, use guard clauses, avoid `else` after `return`.
- Avoid clever code (one-liners that need decoding, metaprogramming, operator tricks). Clear beats short.
- If two solutions work, pick the one a new teammate understands fastest.

    // Bad
    function getDiscount(user) {
      if (user) {
        if (user.isActive) {
          if (user.orders > 10) return 0.1;
          else return 0;
        } else return 0;
      } else return 0;
    }

    // Good
    function getDiscount(user) {
      if (!user?.isActive) return 0;
      return user.orders > 10 ? 0.1 : 0;
    }

## 2. DRY: Don't Repeat Yourself (with judgment)
- Never duplicate knowledge: business rules, constants, validation, config, or types belong in one place.
- Duplicated code is not always duplicated knowledge. Two snippets that look alike but change for different reasons should stay separate.
- Rule of three: tolerate the second copy, and extract on the third, once the shared shape is actually clear.
- A wrong abstraction costs more than duplication. If a shared helper keeps growing flags and special cases (`if (type === 'admin')`), inline it back and split it.
- Before writing a helper, search the codebase. Reuse what already exists instead of creating a near-copy.

## 3. YAGNI: Just Because You Can Doesn't Mean You Should
- Build only what the current requirement needs. No "might need it later" parameters, config options, plugin systems, generic base classes, or interfaces with a single implementation.
- Don't add a dependency for something achievable in a few lines.
- Don't add caching, queues, microservices, or patterns (factory, strategy, repository) until a real problem demands them.
- Don't optimize without a measured bottleneck.
- Stay in scope: do what was asked. Don't refactor unrelated files, rename things, or "improve" code outside the task. Mention those ideas instead of doing them.
- Every line of code is a liability that must be read, tested, and maintained. The best code is code you didn't write.

## 4. Comments: Less, but Better
- Code explains WHAT. Comments explain WHY, and only when the why isn't obvious (a workaround, business rule, gotcha, or non-obvious constraint).
- If a comment is needed to explain what the code does, rename or restructure the code instead.
- Never write comments that restate the code, narrate steps, or describe the change history:

      // Bad
      // Increment the counter
      count++;
      // Loop through users
      for (const user of users) { ... }
      // Added fix for bug #123
      // Updated to use new API

      // Good
      // Stripe retries webhooks for up to 3 days, so handlers must be idempotent.

- No commented-out code. Git remembers it.
- No section-divider banners or decorative comment blocks.
- Docstrings only for public APIs or libraries, and kept short.
- Match the comment density of the surrounding codebase.

## 5. Single Responsibility and Separation of Concerns
- A function does one thing. A module has one reason to change.
- Keep I/O (database, network, filesystem) at the edges and logic in pure functions in the middle. Pure functions are easier to test and reuse.
- Don't mix layers: UI components don't run SQL, and data access code doesn't format HTML.
- Prefer composition over inheritance. Avoid deep class hierarchies.

## 6. Naming
- Names reveal intent: `unpaidInvoices`, not `data`, `list2`, `tmp`, or `handleStuff`.
- Functions are verbs (`calculateTotal`), booleans are questions (`isActive`, `hasAccess`), collections are plural.
- Name length matches scope: `i` in a 3-line loop is fine, module-level names should be descriptive.
- Avoid abbreviations unless they're universal (`id`, `url`, `db`).
- Use the domain's language consistently. One concept, one name across the codebase.

## 7. Functions and Structure
- Small and focused. If a function needs "and" to describe it, split it.
- Few parameters (3 or fewer). Beyond that, pass an object.
- No boolean flag parameters that switch behavior (`render(true)`). Write two functions or use a named option.
- Avoid hidden side effects. A function called `getUser` must not also write to the database.
- Prefer immutability and returning new values over mutating inputs.

## 8. Errors and Edge Cases
- Fail fast and loudly. Validate at system boundaries (user input, external APIs), then trust data internally.
- Never swallow errors silently (`catch {}`). Handle them, or let them propagate.
- Don't add defensive checks for situations that can't happen. They add noise and hide real bugs.
- Error messages say what went wrong and what to do about it.

## 9. Consistency Beats Personal Preference
- Before writing, read nearby code. Match its style, patterns, file structure, naming, error handling, and libraries.
- Don't introduce a second way of doing something the codebase already does one way.
- Follow the project's linter, formatter, and conventions. Don't fight them.

## 10. Principle of Least Surprise
- Code behaves the way its name and signature suggest.
- Similar things look similar. Different things look different.
- Explicit over implicit: avoid magic values (use named constants), hidden globals, and surprising defaults.

## 11. Dependencies
- Before adding a package, ask: is it maintained, how big is it, and can I write this in under 20 lines?
- Pin versions and avoid overlapping libraries (two date libraries, two HTTP clients).

## 12. Delete Freely
- Remove dead code, unused imports, unused variables, stale feature flags, and obsolete files as part of the change that makes them dead.
- Fewer lines that do the same job is a win.

## 13. Testing
- Test behavior, not implementation details. Tests shouldn't break when internals are refactored.
- Each test checks one thing and has a descriptive name (`returns 0 discount for inactive users`).
- Don't mock what you own unless necessary. Prefer real objects and fakes at boundaries.

## Self-check before finishing
Ask these about every change:
1. Is this the simplest thing that works?
2. Did I build anything that wasn't asked for?
3. Did I duplicate logic or knowledge that already exists?
4. Did I create an abstraction with only one use?
5. Would a teammate understand this without comments?
6. Did I delete every comment that only restates the code?
7. Does it match the surrounding code's style?
8. Did I stay within the scope of the task?
9. Can any of this be deleted?

If any answer is wrong, fix it before presenting the code.

## When reviewing code
Report findings grouped by principle, each with: location, the problem, why it matters, and the simpler alternative as code. Order by impact. Call out over-engineering as firmly as bugs. Also note what is already done well, so it isn't changed unnecessarily.