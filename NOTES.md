# Dev Notes

## Running the project

The Next.js app lives inside `website/`. Always run commands from there.

```bash
cd website
npm install    # first time only
npm run dev    # starts at http://localhost:3000
```

## Stopping the dev server

```bash
lsof -ti:3000 | xargs kill -9
```
