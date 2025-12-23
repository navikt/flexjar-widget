# Contributing to Flexjar Widget

## Local Development

```sh
npm install
npm run build
npm run storybook  # View components in Storybook
```

## Publishing to GitHub Packages

1. **Authenticate (one-time)**
   ```sh
   npm config set //npm.pkg.github.com/:_authToken=<TOKEN>
   ```
   Token needs `write:packages`, `read:packages`, and `repo` scopes.

2. **Step into the package folder**
   ```sh
   cd packages/widget
   ```

3. **Bump version** (Semantic Versioning)
   ```sh
   npm version patch  # Bug fix
   npm version minor  # New feature
   npm version major  # Breaking change
   ```

4. **Verify and publish**
   ```sh
   npm run build
   npm publish --registry=https://npm.pkg.github.com
   git push && git push --tags
   ```

## Project Structure

```
packages/widget/
├── src/
│   ├── core/           # useFlexJar hook, types
│   ├── components/     # FlexJarDock, question renderers
│   ├── presets/        # createRatingSurvey, createTopTasksSurvey
│   └── persistence/    # localStorage handling
└── dist/               # Built output
```

## Testing

```sh
npm test              # Run tests
npm run storybook     # Visual testing
```
