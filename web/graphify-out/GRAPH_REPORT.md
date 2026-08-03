# Graph Report - web  (2026-08-03)

## Corpus Check
- 44 files · ~1,963,265 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 258 nodes · 425 edges · 21 communities (14 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46502106`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- camera-screen-shell.tsx
- endofile-dataset.ts
- image-validation-context.tsx
- compilerOptions
- endofile-model-context.tsx
- dependencies
- icons.tsx
- devDependencies
- generate-photo-manifest.mjs
- layout.tsx
- README.md
- colors.ts
- eslint.config.mjs
- GEMINI.md
- next.config.ts
- postcss.config.mjs
- validation-settings-modal.tsx
- camera-context.tsx
- loading-styles.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `useEndofileAi()` - 15 edges
3. `useCamera()` - 11 edges
4. `saveScanItem()` - 9 edges
5. `ImageValidationProvider()` - 8 edges
6. `getEndoFileInfo()` - 8 edges
7. `validateAllImages()` - 8 edges
8. `isOpenCVReady()` - 8 edges
9. `ImageValidationContextType` - 7 edges
10. `ImageValidationResults` - 7 edges

## Surprising Connections (you probably didn't know these)
- `CameraContextProvider()` --calls--> `useEndofileAi()`  [EXTRACTED]
  app/components/camera-context.tsx → app/components/endofile-model-context.tsx
- `CameraContextProvider()` --calls--> `validateAllImages()`  [EXTRACTED]
  app/components/camera-context.tsx → app/lib/image-validations.ts
- `EFileDetectionCard()` --calls--> `getEndoFileInfo()`  [EXTRACTED]
  app/components/endofile-detection-card.tsx → app/constants/endofile-dataset.ts
- `ImageValidationBannerProps` --references--> `ImageValidationResults`  [EXTRACTED]
  app/components/image-validation-banner.tsx → app/lib/image-validations.ts
- `CameraBottomBar()` --calls--> `useCamera()`  [EXTRACTED]
  app/components/camera-bottom-bar.tsx → app/components/camera-context.tsx

## Import Cycles
- None detected.

## Communities (21 total, 7 thin omitted)

### Community 0 - "camera-screen-shell.tsx"
Cohesion: 0.17
Nodes (19): CameraBottomBar(), CameraBottomBarProps, useCamera(), CameraDetectionBadge(), CameraDetectionBadgeProps, CameraHeader(), CameraHeaderProps, CameraScreenShell() (+11 more)

### Community 1 - "endofile-dataset.ts"
Cohesion: 0.09
Nodes (29): CatalogFileRow(), CatalogFileRowProps, EFileDetectionCard(), EFileDetectionCardProps, EFileDetectionCard(), EFileDetectionCardProps, FileCatalogView(), FileCatalogViewProps (+21 more)

### Community 2 - "image-validation-context.tsx"
Cohesion: 0.21
Nodes (22): CameraContextType, ImageValidationBanner(), ImageValidationBannerProps, ImageValidationContext, ImageValidationContextType, ImageValidationProvider(), BlurValidationResult, BoundingBox (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "endofile-model-context.tsx"
Cohesion: 0.19
Nodes (22): EndofileAiContext, EndofileAiContextType, EndofileContextProvider(), PredictionSource, TensorFlow, TopPrediction, clearScanHistory(), deleteKeys() (+14 more)

### Community 5 - "dependencies"
Cohesion: 0.09
Nodes (22): lucide-react, next, dependencies, lucide-react, next, react, react-dom, @techstark/opencv-js (+14 more)

### Community 7 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 8 - "generate-photo-manifest.mjs"
Cohesion: 0.17
Nodes (9): catalogIds, catalogOrder, DATASET_FILE, entries, orphans, OUT_FILE, PHOTO_DIR, photos (+1 more)

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 11 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 18 - "validation-settings-modal.tsx"
Cohesion: 0.67
Nodes (3): useImageValidation(), ValidationSettingsModal(), ValidationSettingsModalProps

### Community 19 - "camera-context.tsx"
Cohesion: 0.15
Nodes (12): CameraContext, CameraContextProvider(), ExtendedMediaTrackCapabilities, ExtendedMediaTrackConstraints, ExtendedMediaTrackConstraintSet, CameraScreen(), CameraScreenProps, LoadingScreen() (+4 more)

## Knowledge Gaps
- **102 isolated node(s):** `CameraBottomBarProps`, `ExtendedMediaTrackCapabilities`, `ExtendedMediaTrackConstraintSet`, `ExtendedMediaTrackConstraints`, `CameraContext` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `FILE_CLASSES` connect `endofile-dataset.ts` to `endofile-model-context.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `CameraBottomBarProps`, `ExtendedMediaTrackCapabilities`, `ExtendedMediaTrackConstraintSet` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `endofile-dataset.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0945945945945946 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._