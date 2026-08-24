# Graph Report - web  (2026-08-24)

## Corpus Check
- 49 files · ~1,981,280 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 281 nodes · 500 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3434b9d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- camera-screen-shell.tsx
- endofile-dataset.ts
- image-validation-context.tsx
- compilerOptions
- endofile-model-context.tsx
- dependencies
- endofile-dataset-complete.ts
- devDependencies
- generate-photo-manifest.mjs
- layout.tsx
- README.md
- eslint.config.mjs
- GEMINI.md
- next.config.ts
- postcss.config.mjs
- ModelScannerPage

## God Nodes (most connected - your core abstractions)
1. `useEndofileAi()` - 19 edges
2. `compilerOptions` - 16 edges
3. `useCamera()` - 13 edges
4. `EndofileContextProvider()` - 9 edges
5. `saveScanItem()` - 9 edges
6. `ImageValidationProvider()` - 8 edges
7. `validateAllImages()` - 8 edges
8. `isOpenCVReady()` - 8 edges
9. `getFilePhoto()` - 7 edges
10. `ImageValidationContextType` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AlternativeCard()` --calls--> `getFilePhoto()`  [EXTRACTED]
  app/components/file/alternatives-view.tsx → app/constants/endofile-photos.ts
- `FileCatalogView()` --calls--> `searchEndoFiles()`  [EXTRACTED]
  app/components/file/file-catalog-view.tsx → app/constants/endofile-dataset.ts
- `ImageValidationBannerProps` --references--> `ImageValidationResults`  [EXTRACTED]
  app/components/overlays/image-validation-banner.tsx → app/lib/image-validations.ts
- `Sidebar()` --indirect_call--> `Home()`  [INFERRED]
  app/components/overlays/sidebar.tsx → app/page.tsx
- `CameraContextProvider()` --calls--> `createScanId()`  [EXTRACTED]
  app/contexts/camera-context.tsx → app/lib/history-store.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "camera-screen-shell.tsx"
Cohesion: 0.10
Nodes (33): CameraBottomBar(), CameraBottomBarProps, CameraDetectionBadge(), CameraDetectionBadgeProps, CameraHeader(), CameraHeaderProps, CameraScreen(), CameraScreenProps (+25 more)

### Community 1 - "endofile-dataset.ts"
Cohesion: 0.10
Nodes (28): CatalogFileRow(), CatalogFileRowProps, EFileDetectionCard(), EFileDetectionCardProps, FileCatalogViewProps, FileDetailView(), FileDetailViewProps, RecentDetectionsViewProps (+20 more)

### Community 2 - "image-validation-context.tsx"
Cohesion: 0.17
Nodes (25): ImageValidationBanner(), ImageValidationBannerProps, ValidationSettingsModal(), ValidationSettingsModalProps, CameraContextType, ImageValidationContext, ImageValidationContextType, ImageValidationProvider() (+17 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "endofile-model-context.tsx"
Cohesion: 0.13
Nodes (30): LoadingScreen(), LoadingScreenProps, ModelScannerPageProps, DEFAULT_MODEL_VERSION, MODEL_CONFIGS, ModelConfig, ModelVersion, EndofileAiContext (+22 more)

### Community 5 - "dependencies"
Cohesion: 0.09
Nodes (22): lucide-react, next, dependencies, lucide-react, next, react, react-dom, @techstark/opencv-js (+14 more)

### Community 6 - "endofile-dataset-complete.ts"
Cohesion: 0.18
Nodes (16): EndoFileClassId, FILE_CLASSES, buildCatalogSystems(), CATALOG_FILE_IDS, CatalogEntry, compareCatalogEntries(), ENDOFILE_DICTIONARY, EndoFileDetails (+8 more)

### Community 7 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 8 - "generate-photo-manifest.mjs"
Cohesion: 0.17
Nodes (9): catalogIds, catalogOrder, DATASET_FILE, entries, orphans, OUT_FILE, PHOTO_DIR, photos (+1 more)

### Community 10 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, viewport

### Community 11 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 19 - "ModelScannerPage"
Cohesion: 0.20
Nodes (4): ModelScannerPage(), Sidebar(), SidebarProps, Home()

## Knowledge Gaps
- **107 isolated node(s):** `CameraBottomBarProps`, `CameraDetectionBadgeProps`, `CameraHeaderProps`, `DetailTarget`, `DrawerState` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FILE_CLASSES` connect `endofile-dataset-complete.ts` to `endofile-dataset.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `useEndofileAi()` connect `camera-screen-shell.tsx` to `endofile-dataset.ts`, `endofile-model-context.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `CameraBottomBarProps`, `CameraDetectionBadgeProps`, `CameraHeaderProps` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `camera-screen-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10303030303030303 - nodes in this community are weakly interconnected._
- **Should `endofile-dataset.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0957983193277311 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._