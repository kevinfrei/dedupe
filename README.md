# dedupe

Cross-platform file deduplication utility

## Evil plans

I already built one of these 10+ years ago in XAML in C# on Windows 7, so
starting there seems reasonable.

- UI to select folders
  - Should support 'reordering' to prioritize some folders above others
- Rapid scan: Just find files of the same size
- Second scan: Just the first X kb of a file to see if they _might_ be the same
- Final scan: Crypto-hash each file, I think.
- Display UI to remove/flip around file duplicates
