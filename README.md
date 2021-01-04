# dedupe

Cross-platform file deduplication utility

It works, it's just clunkier than I'd like, now.

(`yarn` then `yarn start` it, if you're here and wondering if you can use it)

I'm to the 'UI to remove files' part, and here are some features I should add in
the future:

- Make the thing look "better" (maybe switch to a DetailList?)
- Ignore these types/Only check these types list(s)
- Results filtering: Size, type, location?
- Show file size discovery progress
- Show file duplication before it's all done
  - Because the process is driven by file sizes, it's safe to do so before
    everything has completed
  - To do this properly, deletion state needs to update the main-process data
    structures, which would help a few other parts of the system anyway...
