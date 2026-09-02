# Changelog

## [1.4.1](https://github.com/kaizenics/davflood/compare/v1.6.1...v1.4.1) (2026-09-01)


### ⚠ BREAKING CHANGES

* **web:** removes the sign-in, sign-up and dashboard routes, the oRPC client and the theme provider. The app has no accounts.
* removes all server, authentication and database code.
* **native:** removes authentication from the mobile app entirely. Deletes lib/auth-client.ts, utils/orpc.ts, components/sign-in.tsx and components/sign-up.tsx, and drops @naboflood/api, @orpc/client, @orpc/tanstack-query, @tanstack/react-form, better-auth and @better-auth/expo from its dependencies. packages/auth, packages/api, apps/server and apps/web are untouched — Phase 5 crowdsourced reports can restore this from history in one commit.

### New

* add Davao River flow history chart ([e60b32f](https://github.com/kaizenics/davflood/commit/e60b32f6f8b5730e6ec4d59075bd0b50df89f864))
* **ci:** add CI workflow for automated checks and builds ([d24859a](https://github.com/kaizenics/davflood/commit/d24859a1cc6e1e019f6175332317efbb155b1593))
* enhance news filtering and handling for barangay-level reporting ([c031086](https://github.com/kaizenics/davflood/commit/c031086f602e9fb07fd1cdbb0a2f95dcf56aca76))
* forecast the river, and carry local flood news ([8fe9d5b](https://github.com/kaizenics/davflood/commit/8fe9d5b19096b9b8d3bca1042119705423073189))
* **hazard:** add @naboflood/hazard shared domain package ([e78ae97](https://github.com/kaizenics/davflood/commit/e78ae977a67a0b307ecc099de3e9d516b36a7696))
* **hazard:** add a light theme with a separately derived hazard palette ([9873ee2](https://github.com/kaizenics/davflood/commit/9873ee2f8fb67968ac2e7fff4a899d56a7fb24e2))
* **hazard:** add hourly rainfall to the forecast model ([0164163](https://github.com/kaizenics/davflood/commit/016416326f050fe769ff23de8e8647fac4eaa1ed))
* **hazard:** add MapLibre base style and hazard layer specs ([c7c3920](https://github.com/kaizenics/davflood/commit/c7c39201ef3e99c25c567e7399aa544b17aed947))
* **hazard:** add Open-Meteo rainfall client ([d9a3f20](https://github.com/kaizenics/davflood/commit/d9a3f202060046676486c6a714dc9f90d100a60b))
* **hazard:** clip NOAH data to the real city outline, not a bounding box ([cf9afd5](https://github.com/kaizenics/davflood/commit/cf9afd55773ee4d6dac052b464cfae849ec47386))
* **hazard:** convert the real UP NOAH shapefiles into app GeoJSON ([45885ca](https://github.com/kaizenics/davflood/commit/45885ca337a4d5d3079f4028b400ecedc97e77e8))
* **hazard:** generate synthetic Panabo flood dataset ([2d4f1bd](https://github.com/kaizenics/davflood/commit/2d4f1bd7afb09cf66d9983adb04bc8f1461011da))
* **hazard:** move the hazard model from Panabo to Davao City ([e62dbc9](https://github.com/kaizenics/davflood/commit/e62dbc9301f7023f2af9cf3ee033f4f7f343ca65))
* **hazard:** replace the placeholder dataset with the real UP NOAH model ([6b38994](https://github.com/kaizenics/davflood/commit/6b389949c909a8337a9fa1ce5c2edb0a6e5fc947))
* **hazard:** satellite basemap, light cartography and tuned terrain ([74224df](https://github.com/kaizenics/davflood/commit/74224dfd4a7a9a1047ca99b88a43057ff94389d3))
* **hazard:** validate the map style against the MapLibre spec ([6fe2241](https://github.com/kaizenics/davflood/commit/6fe22417d8407800cf904f02dec8a299f7c44068))
* **native:** add 3D flood hazard map screen ([0fc8bdc](https://github.com/kaizenics/davflood/commit/0fc8bdc143eff59f8d78a19a4afaf302b131c047))
* **native:** add barangay search, learn and about screens ([e2f8e9f](https://github.com/kaizenics/davflood/commit/e2f8e9fa603c50ab7e71214f27a4f62128336060))
* **native:** add first-run onboarding ([9647d24](https://github.com/kaizenics/davflood/commit/9647d24e5a49c71d6685a375a1b7d00ba0262589))
* **native:** configure MapLibre, app identity and hazard theme tokens ([ac40e5f](https://github.com/kaizenics/davflood/commit/ac40e5fe288138581e66698a96fcda82c80a98a3))
* **news:** pin reported flooding to the barangay it happened in ([89e6a6c](https://github.com/kaizenics/davflood/commit/89e6a6cc5ec835655821b402c2d56904dde06147))
* **news:** read the publishers directly, and show their photographs ([1b0182a](https://github.com/kaizenics/davflood/commit/1b0182ab8927bf56fb5e0e5e9685fbcd4f2a3724))
* **news:** say how long ago, down to the minute ([8e8f3ab](https://github.com/kaizenics/davflood/commit/8e8f3abb6ecd4494278da438414d3f55c607c7f1))
* **news:** serve the news from a function, not a bot ([9884ecc](https://github.com/kaizenics/davflood/commit/9884ecc909d7749d1d6a87a8b687254c1db5d4cb))
* **news:** source the news from Google News, and ship a real file ([fbf05d0](https://github.com/kaizenics/davflood/commit/fbf05d08fbba236b55010e89096f424041864d2a))
* refactor news handler and add cron job for news fetching ([c992ab3](https://github.com/kaizenics/davflood/commit/c992ab37742b224210a4d2ba3c685e6d7e820225))
* **skills:** tasteskill added ([8dc0b74](https://github.com/kaizenics/davflood/commit/8dc0b745d46a1f532e9e377883ed6fef6322db59))
* **web:** a page for every barangay in Davao City ([9b7ebcf](https://github.com/kaizenics/davflood/commit/9b7ebcf34a1ae3dd63af6ec75934402ed45918ea))
* **web:** a page for every flood report ([c6ecc4c](https://github.com/kaizenics/davflood/commit/c6ecc4c4f2e10e550b5749db115b2940428d2975))
* **web:** a share card, generated from the palette ([2ad196e](https://github.com/kaizenics/davflood/commit/2ad196e5a9846832cf9f7faf7e4c9bb7a2771f7f))
* **web:** add a basemap switcher and a hazard overlay toggle ([13d84a9](https://github.com/kaizenics/davflood/commit/13d84a91d9640ee177b533a5bb678312b7f550e2))
* **web:** add a shadcn dialog and an hourly rainfall area chart ([62db3e0](https://github.com/kaizenics/davflood/commit/62db3e0eb4fda8352b2e815c825459a8460a454c))
* **web:** add a theme toggle that remembers and respects the OS ([5f554f9](https://github.com/kaizenics/davflood/commit/5f554f9852af91b505eec40cc79478c569b6a974))
* **web:** add browser map preview harness at /map-preview ([b0d11ae](https://github.com/kaizenics/davflood/commit/b0d11ae94890a73221ef1f0740b42f0e9d39e417))
* **web:** add versioning and changelog functionality with release management ([411b94d](https://github.com/kaizenics/davflood/commit/411b94d3aa160e5279db411b1881d5521649c621))
* **web:** animate the reading slot between the city and one barangay ([f2c1820](https://github.com/kaizenics/davflood/commit/f2c1820feb6d89bb38a8846cc189cbcf4dc60ac9))
* **web:** answer the questions people actually ask, once ([ae33215](https://github.com/kaizenics/davflood/commit/ae33215aac212952fb09cb329bcad9d030447b7c))
* **web:** build the flood map app ([2727fb8](https://github.com/kaizenics/davflood/commit/2727fb82f4a945e6af2326409ce533d90740cbf8))
* **web:** describe every page to search engines properly ([2d30612](https://github.com/kaizenics/davflood/commit/2d30612d2a3d2722934d9963f948a22a8be81d58))
* **web:** draw the way to shelter on our own map ([c61f9ac](https://github.com/kaizenics/davflood/commit/c61f9ac0d8443afc21b0835ec69491f44511cf84))
* **web:** extrude flood zones by depth and make the view angle adjustable ([4057097](https://github.com/kaizenics/davflood/commit/405709732f08f6334af39aee2a36bc81eaff025c))
* **web:** float the reading over the map ([2baf19f](https://github.com/kaizenics/davflood/commit/2baf19f90430298b8c549e73a678789d26a8056b))
* **web:** fly to a tapped barangay and drop a pin ([353a918](https://github.com/kaizenics/davflood/commit/353a918a87fbb0809efc1aabe644fa419c58fa7c))
* **web:** give the map the whole phone screen ([402f9c3](https://github.com/kaizenics/davflood/commit/402f9c30b33297d0c502d3eef3f197b1e243af0c))
* **web:** implement collapsible rainfall panel with animation ([b898c5d](https://github.com/kaizenics/davflood/commit/b898c5da90e8ddb422af619a8a3941bd8fd4360b))
* **web:** migrate to TanStack Start with static prerendering ([3caaa7f](https://github.com/kaizenics/davflood/commit/3caaa7f1837904f62ad6fa0fd9a56cf3e1663a36))
* **web:** move the masthead into the panel, drop the bar ([0383b1c](https://github.com/kaizenics/davflood/commit/0383b1c4d5160db3babd2018be4b50600feed279))
* **web:** offer to save a place from the pin, not the panel ([d5e3996](https://github.com/kaizenics/davflood/commit/d5e399619f0cfa8e2b14900934b3c728058fe4e5))
* **web:** one screen — every page is a panel beside the live map ([eb2b38a](https://github.com/kaizenics/davflood/commit/eb2b38a5e28d93fdbf2a9ba0e026f816cb8fe9a7))
* **web:** one shell — sidebar everywhere, header only on phones ([4ca2c4f](https://github.com/kaizenics/davflood/commit/4ca2c4fbcfe1f373ac477bddefb607a9b3e06fbd))
* **web:** open an hour-by-hour rainfall detail from each forecast day ([69a0219](https://github.com/kaizenics/davflood/commit/69a02198f5fba84df91e64cb52579e0524b126e7))
* **web:** open flat, and let the reader ask for depth ([11ecbd0](https://github.com/kaizenics/davflood/commit/11ecbd01f7d57ad083a38a9c71f5b6702680d1a6))
* **web:** open on the worst case, not the middle one ([2111f8d](https://github.com/kaizenics/davflood/commit/2111f8d36e39b5d463ad19b7416f4495f466d6ae))
* **web:** put the map view controls on the map on phones ([dc90470](https://github.com/kaizenics/davflood/commit/dc904700349091e169d7c8ca2f81fb8e26ab3726))
* **web:** put the view controls on the map, and start on satellite ([f63103e](https://github.com/kaizenics/davflood/commit/f63103e362b6b6086de61de06973ed338084b0d9))
* **web:** read the safety copy in Bisaya and Tagalog ([45199cf](https://github.com/kaizenics/davflood/commit/45199cf66dd51aadbe9aba63c87af3e0bb2fa6bc))
* **web:** rebrand the app and marketing site to DavFlood ([6b4499e](https://github.com/kaizenics/davflood/commit/6b4499e76d309eab3876b3e7f08bcb47edb6bef3))
* **web:** rebuild the map sidebar around a single reading ([7b650dd](https://github.com/kaizenics/davflood/commit/7b650ddd94c68c05812a521911791da374951734))
* **web:** redraw the wordmark around a waterline ([264d1dc](https://github.com/kaizenics/davflood/commit/264d1dc46151ab577984b3d4f631685faca3d945))
* **web:** refine guide and pin functionality on the map, update directions handling ([9241b93](https://github.com/kaizenics/davflood/commit/9241b93c50a1f69cb23f8a43534e8b49097038c6))
* **web:** rework the layout as a desktop website ([ca6a664](https://github.com/kaizenics/davflood/commit/ca6a66467bcea291a3259720580fc4b054df1306))
* **web:** save your place, and save the numbers to your phone ([675da72](https://github.com/kaizenics/davflood/commit/675da722df4371f7c33900fc4024308bb488d712))
* **web:** say how high the tapped ground is ([4fb79a6](https://github.com/kaizenics/davflood/commit/4fb79a6a0b5e309c99b1791632450cb8d3b5d027))
* **web:** set the interface in Manrope ([6e2b4e9](https://github.com/kaizenics/davflood/commit/6e2b4e9ec0cce20cbcfc3f37203dd53470678ca0))
* **web:** show the tapped spot in all three storms at once ([31cb6fa](https://github.com/kaizenics/davflood/commit/31cb6fa898f014133fba3642a45288dd3cf406f9))
* **web:** show where rain is falling, as rain ([45c0777](https://github.com/kaizenics/davflood/commit/45c07773128e3d65e66b50a876f5a41a76bd2a3b))
* **web:** somewhere to go, and directions to it ([77a8de5](https://github.com/kaizenics/davflood/commit/77a8de53403632018e462ac58cf0b68a562158f5))
* **web:** who to call, and what the rain means for where you tapped ([70bcf1a](https://github.com/kaizenics/davflood/commit/70bcf1a5eb1cbd400a25b60e7f41aca04b5ca774))
* **web:** work without a signal, and say which way is out ([4d1ba03](https://github.com/kaizenics/davflood/commit/4d1ba0345f3e47952c9d20588ccff13cd3a0105c))


### Fixed

* add canonical redirect to consolidate search engine ranking ([b472d56](https://github.com/kaizenics/davflood/commit/b472d56d5f59408fbb674d0c6a04a2f08a16faab))
* **ci:** check out before merging, and land releases under the maintainer ([e5588b2](https://github.com/kaizenics/davflood/commit/e5588b247defd0419b8a544fcf7618f9db4fbc8f))
* configure Vercel hosting so the deployed site is not a 404 ([b5dabe1](https://github.com/kaizenics/davflood/commit/b5dabe18ac72908846b1ff1eff6189eb11a3e866))
* **hazard:** include barangays OSM maps only as a point ([2199c45](https://github.com/kaizenics/davflood/commit/2199c4505f9530e56332b969847c432dcccf8d7e))
* **hazard:** round off the shards Douglas-Peucker leaves in the polygons ([a70ded5](https://github.com/kaizenics/davflood/commit/a70ded56801c5621d420fa8e0ec8b2a8cf71251a))
* improve prerendering configuration to handle 189 pages with retries and error handling ([2aca34f](https://github.com/kaizenics/davflood/commit/2aca34f80e84c388aa6808f6d733e440c599ee14))
* **native:** guard map operations against the pre-load window ([89f9402](https://github.com/kaizenics/davflood/commit/89f9402066dad9b788c7d7040a1775fc70be3909))
* **native:** persist the onboarding flag on web ([1d255d2](https://github.com/kaizenics/davflood/commit/1d255d2f5f75480c00c32a30c0cd0e396e519d25))
* **native:** render the map with maplibre-gl on web ([204d988](https://github.com/kaizenics/davflood/commit/204d9885d83053410c937fa77fd7d33500db3160))
* **native:** surface map failures instead of rendering a black rectangle ([23c5ef8](https://github.com/kaizenics/davflood/commit/23c5ef83ad6d0642af7492022760072fca9de05b))
* update cron schedule for news fetching to run daily ([989a0c1](https://github.com/kaizenics/davflood/commit/989a0c123539f582c441f13f2bb080ae42ebbfac))
* update redirect URL to include 'www' for canonical domain ([b5484d7](https://github.com/kaizenics/davflood/commit/b5484d79d93ca8081c3813eabc2fc9fb6e44d0d7))
* **web:** draw a house on the save button, not a smudge ([b3b03ad](https://github.com/kaizenics/davflood/commit/b3b03adf9913884354919621ed2b2d59747249bb))
* **web:** keep the four-day forecast on screen when it is dry ([58afd28](https://github.com/kaizenics/davflood/commit/58afd28efa2b9ec724a24d8a52b7a1698a88495a))
* **web:** let the map show through the hazard fills ([72f30cf](https://github.com/kaizenics/davflood/commit/72f30cf5ce276ff22b4f9fbdee447a0d4d741d30))
* **web:** make the hazard bands read again over satellite ([5918190](https://github.com/kaizenics/davflood/commit/59181903d0e4989c71434884d872cf715577f855))
* **web:** make the map work in the production build ([73feec6](https://github.com/kaizenics/davflood/commit/73feec6bcfab7b873b5c82e60711d79e234aa36e))
* **web:** point MapLibre at a worker the bundler can actually serve ([0c310f1](https://github.com/kaizenics/davflood/commit/0c310f1a42e237e621d901e28c25dad8f4812f38))
* **web:** repair the mojibake in the map view controls ([48b3794](https://github.com/kaizenics/davflood/commit/48b37942f5d55c6a75b98aa1d1574a8293736bcc))
* **web:** stop the build hanging after it has finished ([d63835d](https://github.com/kaizenics/davflood/commit/d63835d45c56c5f7085a8571c0c9d607e5be443f))
* **web:** stop the hazard layer doubling when you zoom out ([f789668](https://github.com/kaizenics/davflood/commit/f78966814264a7562a468ab9f091778199411f92))
* **web:** stop the map hanging on "Loading the map…" ([5b66a2c](https://github.com/kaizenics/davflood/commit/5b66a2ccb4702397a32515f42deb8df14a70ea2f))
* **web:** stop the page scrolling out from under the app ([f1ec5e7](https://github.com/kaizenics/davflood/commit/f1ec5e7d02059348262a97ee66abbe6345927f93))


### Faster

* **web:** fetch hazard data per scenario instead of bundling all three ([bd9c892](https://github.com/kaizenics/davflood/commit/bd9c8920bbde8cbb2699a32011559d143da3bd57))


### Under the hood

* **native:** replace drawer/auth scaffold with map-first tabs ([f88b203](https://github.com/kaizenics/davflood/commit/f88b2035a7ffb25a25ea5b70d0e0d5809d9be15d))
* remove the server, auth, db and UI scaffold ([80b980e](https://github.com/kaizenics/davflood/commit/80b980e4dffb33bfe0ebec11230d038cf2ee6245))

## [1.6.1](https://github.com/kaizenics/davflood/compare/v1.6.0...v1.6.1) (2026-09-01)


### New

* add Davao River flow history chart ([e60b32f](https://github.com/kaizenics/davflood/commit/e60b32f))

## [1.6.0](https://github.com/kaizenics/davflood/compare/v1.5.2...v1.6.0) (2026-08-30)


### New

* enhance news filtering and handling for barangay-level reporting ([c031086](https://github.com/kaizenics/davflood/commit/c031086f602e9fb07fd1cdbb0a2f95dcf56aca76))
* refactor news handler and add cron job for news fetching ([c992ab3](https://github.com/kaizenics/davflood/commit/c992ab37742b224210a4d2ba3c685e6d7e820225))


### Fixed

* configure Vercel hosting so the deployed site is not a 404 ([b5dabe1](https://github.com/kaizenics/davflood/commit/b5dabe18ac72908846b1ff1eff6189eb11a3e866))
* update cron schedule for news fetching to run daily ([989a0c1](https://github.com/kaizenics/davflood/commit/989a0c123539f582c441f13f2bb080ae42ebbfac))

## [1.5.2](https://github.com/kaizenics/davflood/compare/v1.5.1...v1.5.2) (2026-08-12)


### Fixed

* add canonical redirect to consolidate search engine ranking ([b472d56](https://github.com/kaizenics/davflood/commit/b472d56d5f59408fbb674d0c6a04a2f08a16faab))
* update redirect URL to include 'www' for canonical domain ([b5484d7](https://github.com/kaizenics/davflood/commit/b5484d79d93ca8081c3813eabc2fc9fb6e44d0d7))

## [1.5.1](https://github.com/kaizenics/davflood/compare/v1.5.0...v1.5.1) (2026-08-12)


### Fixed

* **ci:** check out before merging, and land releases under the maintainer ([e5588b2](https://github.com/kaizenics/davflood/commit/e5588b247defd0419b8a544fcf7618f9db4fbc8f))
* improve prerendering configuration to handle 189 pages with retries and error handling ([2aca34f](https://github.com/kaizenics/davflood/commit/2aca34f80e84c388aa6808f6d733e440c599ee14))

## [1.5.0](https://github.com/kaizenics/davflood/compare/v1.4.1...v1.5.0) (2026-08-12)


### New

* **web:** a page for every barangay in Davao City ([9b7ebcf](https://github.com/kaizenics/davflood/commit/9b7ebcf34a1ae3dd63af6ec75934402ed45918ea))
* **web:** open flat, and let the reader ask for depth ([11ecbd0](https://github.com/kaizenics/davflood/commit/11ecbd01f7d57ad083a38a9c71f5b6702680d1a6))
* **web:** open on the worst case, not the middle one ([2111f8d](https://github.com/kaizenics/davflood/commit/2111f8d36e39b5d463ad19b7416f4495f466d6ae))
* **web:** show the tapped spot in all three storms at once ([31cb6fa](https://github.com/kaizenics/davflood/commit/31cb6fa898f014133fba3642a45288dd3cf406f9))


### Fixed

* **ci:** check out before merging, and land releases under the maintainer ([e5588b2](https://github.com/kaizenics/davflood/commit/e5588b247defd0419b8a544fcf7618f9db4fbc8f))
* **web:** let the map show through the hazard fills ([72f30cf](https://github.com/kaizenics/davflood/commit/72f30cf5ce276ff22b4f9fbdee447a0d4d741d30))
* **web:** make the hazard bands read again over satellite ([5918190](https://github.com/kaizenics/davflood/commit/59181903d0e4989c71434884d872cf715577f855))
* **web:** stop the hazard layer doubling when you zoom out ([f789668](https://github.com/kaizenics/davflood/commit/f78966814264a7562a468ab9f091778199411f92))

## [1.4.1](https://github.com/kaizenics/davflood/compare/v1.5.1...v1.4.1) (2026-08-12)


### ⚠ BREAKING CHANGES

* **web:** removes the sign-in, sign-up and dashboard routes, the oRPC client and the theme provider. The app has no accounts.
* removes all server, authentication and database code.
* **native:** removes authentication from the mobile app entirely. Deletes lib/auth-client.ts, utils/orpc.ts, components/sign-in.tsx and components/sign-up.tsx, and drops @naboflood/api, @orpc/client, @orpc/tanstack-query, @tanstack/react-form, better-auth and @better-auth/expo from its dependencies. packages/auth, packages/api, apps/server and apps/web are untouched — Phase 5 crowdsourced reports can restore this from history in one commit.

### New

* **ci:** add CI workflow for automated checks and builds ([d24859a](https://github.com/kaizenics/davflood/commit/d24859a1cc6e1e019f6175332317efbb155b1593))
* forecast the river, and carry local flood news ([8fe9d5b](https://github.com/kaizenics/davflood/commit/8fe9d5b19096b9b8d3bca1042119705423073189))
* **hazard:** add @naboflood/hazard shared domain package ([e78ae97](https://github.com/kaizenics/davflood/commit/e78ae977a67a0b307ecc099de3e9d516b36a7696))
* **hazard:** add a light theme with a separately derived hazard palette ([9873ee2](https://github.com/kaizenics/davflood/commit/9873ee2f8fb67968ac2e7fff4a899d56a7fb24e2))
* **hazard:** add hourly rainfall to the forecast model ([0164163](https://github.com/kaizenics/davflood/commit/016416326f050fe769ff23de8e8647fac4eaa1ed))
* **hazard:** add MapLibre base style and hazard layer specs ([c7c3920](https://github.com/kaizenics/davflood/commit/c7c39201ef3e99c25c567e7399aa544b17aed947))
* **hazard:** add Open-Meteo rainfall client ([d9a3f20](https://github.com/kaizenics/davflood/commit/d9a3f202060046676486c6a714dc9f90d100a60b))
* **hazard:** clip NOAH data to the real city outline, not a bounding box ([cf9afd5](https://github.com/kaizenics/davflood/commit/cf9afd55773ee4d6dac052b464cfae849ec47386))
* **hazard:** convert the real UP NOAH shapefiles into app GeoJSON ([45885ca](https://github.com/kaizenics/davflood/commit/45885ca337a4d5d3079f4028b400ecedc97e77e8))
* **hazard:** generate synthetic Panabo flood dataset ([2d4f1bd](https://github.com/kaizenics/davflood/commit/2d4f1bd7afb09cf66d9983adb04bc8f1461011da))
* **hazard:** move the hazard model from Panabo to Davao City ([e62dbc9](https://github.com/kaizenics/davflood/commit/e62dbc9301f7023f2af9cf3ee033f4f7f343ca65))
* **hazard:** replace the placeholder dataset with the real UP NOAH model ([6b38994](https://github.com/kaizenics/davflood/commit/6b389949c909a8337a9fa1ce5c2edb0a6e5fc947))
* **hazard:** satellite basemap, light cartography and tuned terrain ([74224df](https://github.com/kaizenics/davflood/commit/74224dfd4a7a9a1047ca99b88a43057ff94389d3))
* **hazard:** validate the map style against the MapLibre spec ([6fe2241](https://github.com/kaizenics/davflood/commit/6fe22417d8407800cf904f02dec8a299f7c44068))
* **native:** add 3D flood hazard map screen ([0fc8bdc](https://github.com/kaizenics/davflood/commit/0fc8bdc143eff59f8d78a19a4afaf302b131c047))
* **native:** add barangay search, learn and about screens ([e2f8e9f](https://github.com/kaizenics/davflood/commit/e2f8e9fa603c50ab7e71214f27a4f62128336060))
* **native:** add first-run onboarding ([9647d24](https://github.com/kaizenics/davflood/commit/9647d24e5a49c71d6685a375a1b7d00ba0262589))
* **native:** configure MapLibre, app identity and hazard theme tokens ([ac40e5f](https://github.com/kaizenics/davflood/commit/ac40e5fe288138581e66698a96fcda82c80a98a3))
* **news:** pin reported flooding to the barangay it happened in ([89e6a6c](https://github.com/kaizenics/davflood/commit/89e6a6cc5ec835655821b402c2d56904dde06147))
* **news:** read the publishers directly, and show their photographs ([1b0182a](https://github.com/kaizenics/davflood/commit/1b0182ab8927bf56fb5e0e5e9685fbcd4f2a3724))
* **news:** say how long ago, down to the minute ([8e8f3ab](https://github.com/kaizenics/davflood/commit/8e8f3abb6ecd4494278da438414d3f55c607c7f1))
* **news:** serve the news from a function, not a bot ([9884ecc](https://github.com/kaizenics/davflood/commit/9884ecc909d7749d1d6a87a8b687254c1db5d4cb))
* **news:** source the news from Google News, and ship a real file ([fbf05d0](https://github.com/kaizenics/davflood/commit/fbf05d08fbba236b55010e89096f424041864d2a))
* **skills:** tasteskill added ([8dc0b74](https://github.com/kaizenics/davflood/commit/8dc0b745d46a1f532e9e377883ed6fef6322db59))
* **web:** a page for every barangay in Davao City ([9b7ebcf](https://github.com/kaizenics/davflood/commit/9b7ebcf34a1ae3dd63af6ec75934402ed45918ea))
* **web:** a page for every flood report ([c6ecc4c](https://github.com/kaizenics/davflood/commit/c6ecc4c4f2e10e550b5749db115b2940428d2975))
* **web:** a share card, generated from the palette ([2ad196e](https://github.com/kaizenics/davflood/commit/2ad196e5a9846832cf9f7faf7e4c9bb7a2771f7f))
* **web:** add a basemap switcher and a hazard overlay toggle ([13d84a9](https://github.com/kaizenics/davflood/commit/13d84a91d9640ee177b533a5bb678312b7f550e2))
* **web:** add a shadcn dialog and an hourly rainfall area chart ([62db3e0](https://github.com/kaizenics/davflood/commit/62db3e0eb4fda8352b2e815c825459a8460a454c))
* **web:** add a theme toggle that remembers and respects the OS ([5f554f9](https://github.com/kaizenics/davflood/commit/5f554f9852af91b505eec40cc79478c569b6a974))
* **web:** add browser map preview harness at /map-preview ([b0d11ae](https://github.com/kaizenics/davflood/commit/b0d11ae94890a73221ef1f0740b42f0e9d39e417))
* **web:** add versioning and changelog functionality with release management ([411b94d](https://github.com/kaizenics/davflood/commit/411b94d3aa160e5279db411b1881d5521649c621))
* **web:** animate the reading slot between the city and one barangay ([f2c1820](https://github.com/kaizenics/davflood/commit/f2c1820feb6d89bb38a8846cc189cbcf4dc60ac9))
* **web:** answer the questions people actually ask, once ([ae33215](https://github.com/kaizenics/davflood/commit/ae33215aac212952fb09cb329bcad9d030447b7c))
* **web:** build the flood map app ([2727fb8](https://github.com/kaizenics/davflood/commit/2727fb82f4a945e6af2326409ce533d90740cbf8))
* **web:** describe every page to search engines properly ([2d30612](https://github.com/kaizenics/davflood/commit/2d30612d2a3d2722934d9963f948a22a8be81d58))
* **web:** draw the way to shelter on our own map ([c61f9ac](https://github.com/kaizenics/davflood/commit/c61f9ac0d8443afc21b0835ec69491f44511cf84))
* **web:** extrude flood zones by depth and make the view angle adjustable ([4057097](https://github.com/kaizenics/davflood/commit/405709732f08f6334af39aee2a36bc81eaff025c))
* **web:** float the reading over the map ([2baf19f](https://github.com/kaizenics/davflood/commit/2baf19f90430298b8c549e73a678789d26a8056b))
* **web:** fly to a tapped barangay and drop a pin ([353a918](https://github.com/kaizenics/davflood/commit/353a918a87fbb0809efc1aabe644fa419c58fa7c))
* **web:** give the map the whole phone screen ([402f9c3](https://github.com/kaizenics/davflood/commit/402f9c30b33297d0c502d3eef3f197b1e243af0c))
* **web:** implement collapsible rainfall panel with animation ([b898c5d](https://github.com/kaizenics/davflood/commit/b898c5da90e8ddb422af619a8a3941bd8fd4360b))
* **web:** migrate to TanStack Start with static prerendering ([3caaa7f](https://github.com/kaizenics/davflood/commit/3caaa7f1837904f62ad6fa0fd9a56cf3e1663a36))
* **web:** move the masthead into the panel, drop the bar ([0383b1c](https://github.com/kaizenics/davflood/commit/0383b1c4d5160db3babd2018be4b50600feed279))
* **web:** offer to save a place from the pin, not the panel ([d5e3996](https://github.com/kaizenics/davflood/commit/d5e399619f0cfa8e2b14900934b3c728058fe4e5))
* **web:** one screen — every page is a panel beside the live map ([eb2b38a](https://github.com/kaizenics/davflood/commit/eb2b38a5e28d93fdbf2a9ba0e026f816cb8fe9a7))
* **web:** one shell — sidebar everywhere, header only on phones ([4ca2c4f](https://github.com/kaizenics/davflood/commit/4ca2c4fbcfe1f373ac477bddefb607a9b3e06fbd))
* **web:** open an hour-by-hour rainfall detail from each forecast day ([69a0219](https://github.com/kaizenics/davflood/commit/69a02198f5fba84df91e64cb52579e0524b126e7))
* **web:** open flat, and let the reader ask for depth ([11ecbd0](https://github.com/kaizenics/davflood/commit/11ecbd01f7d57ad083a38a9c71f5b6702680d1a6))
* **web:** open on the worst case, not the middle one ([2111f8d](https://github.com/kaizenics/davflood/commit/2111f8d36e39b5d463ad19b7416f4495f466d6ae))
* **web:** put the map view controls on the map on phones ([dc90470](https://github.com/kaizenics/davflood/commit/dc904700349091e169d7c8ca2f81fb8e26ab3726))
* **web:** put the view controls on the map, and start on satellite ([f63103e](https://github.com/kaizenics/davflood/commit/f63103e362b6b6086de61de06973ed338084b0d9))
* **web:** read the safety copy in Bisaya and Tagalog ([45199cf](https://github.com/kaizenics/davflood/commit/45199cf66dd51aadbe9aba63c87af3e0bb2fa6bc))
* **web:** rebrand the app and marketing site to DavFlood ([6b4499e](https://github.com/kaizenics/davflood/commit/6b4499e76d309eab3876b3e7f08bcb47edb6bef3))
* **web:** rebuild the map sidebar around a single reading ([7b650dd](https://github.com/kaizenics/davflood/commit/7b650ddd94c68c05812a521911791da374951734))
* **web:** redraw the wordmark around a waterline ([264d1dc](https://github.com/kaizenics/davflood/commit/264d1dc46151ab577984b3d4f631685faca3d945))
* **web:** refine guide and pin functionality on the map, update directions handling ([9241b93](https://github.com/kaizenics/davflood/commit/9241b93c50a1f69cb23f8a43534e8b49097038c6))
* **web:** rework the layout as a desktop website ([ca6a664](https://github.com/kaizenics/davflood/commit/ca6a66467bcea291a3259720580fc4b054df1306))
* **web:** save your place, and save the numbers to your phone ([675da72](https://github.com/kaizenics/davflood/commit/675da722df4371f7c33900fc4024308bb488d712))
* **web:** say how high the tapped ground is ([4fb79a6](https://github.com/kaizenics/davflood/commit/4fb79a6a0b5e309c99b1791632450cb8d3b5d027))
* **web:** set the interface in Manrope ([6e2b4e9](https://github.com/kaizenics/davflood/commit/6e2b4e9ec0cce20cbcfc3f37203dd53470678ca0))
* **web:** show the tapped spot in all three storms at once ([31cb6fa](https://github.com/kaizenics/davflood/commit/31cb6fa898f014133fba3642a45288dd3cf406f9))
* **web:** show where rain is falling, as rain ([45c0777](https://github.com/kaizenics/davflood/commit/45c07773128e3d65e66b50a876f5a41a76bd2a3b))
* **web:** somewhere to go, and directions to it ([77a8de5](https://github.com/kaizenics/davflood/commit/77a8de53403632018e462ac58cf0b68a562158f5))
* **web:** who to call, and what the rain means for where you tapped ([70bcf1a](https://github.com/kaizenics/davflood/commit/70bcf1a5eb1cbd400a25b60e7f41aca04b5ca774))
* **web:** work without a signal, and say which way is out ([4d1ba03](https://github.com/kaizenics/davflood/commit/4d1ba0345f3e47952c9d20588ccff13cd3a0105c))


### Fixed

* **ci:** check out before merging, and land releases under the maintainer ([e5588b2](https://github.com/kaizenics/davflood/commit/e5588b247defd0419b8a544fcf7618f9db4fbc8f))
* **hazard:** include barangays OSM maps only as a point ([2199c45](https://github.com/kaizenics/davflood/commit/2199c4505f9530e56332b969847c432dcccf8d7e))
* **hazard:** round off the shards Douglas-Peucker leaves in the polygons ([a70ded5](https://github.com/kaizenics/davflood/commit/a70ded56801c5621d420fa8e0ec8b2a8cf71251a))
* **native:** guard map operations against the pre-load window ([89f9402](https://github.com/kaizenics/davflood/commit/89f9402066dad9b788c7d7040a1775fc70be3909))
* **native:** persist the onboarding flag on web ([1d255d2](https://github.com/kaizenics/davflood/commit/1d255d2f5f75480c00c32a30c0cd0e396e519d25))
* **native:** render the map with maplibre-gl on web ([204d988](https://github.com/kaizenics/davflood/commit/204d9885d83053410c937fa77fd7d33500db3160))
* **native:** surface map failures instead of rendering a black rectangle ([23c5ef8](https://github.com/kaizenics/davflood/commit/23c5ef83ad6d0642af7492022760072fca9de05b))
* **web:** draw a house on the save button, not a smudge ([b3b03ad](https://github.com/kaizenics/davflood/commit/b3b03adf9913884354919621ed2b2d59747249bb))
* **web:** keep the four-day forecast on screen when it is dry ([58afd28](https://github.com/kaizenics/davflood/commit/58afd28efa2b9ec724a24d8a52b7a1698a88495a))
* **web:** let the map show through the hazard fills ([72f30cf](https://github.com/kaizenics/davflood/commit/72f30cf5ce276ff22b4f9fbdee447a0d4d741d30))
* **web:** make the hazard bands read again over satellite ([5918190](https://github.com/kaizenics/davflood/commit/59181903d0e4989c71434884d872cf715577f855))
* **web:** make the map work in the production build ([73feec6](https://github.com/kaizenics/davflood/commit/73feec6bcfab7b873b5c82e60711d79e234aa36e))
* **web:** point MapLibre at a worker the bundler can actually serve ([0c310f1](https://github.com/kaizenics/davflood/commit/0c310f1a42e237e621d901e28c25dad8f4812f38))
* **web:** repair the mojibake in the map view controls ([48b3794](https://github.com/kaizenics/davflood/commit/48b37942f5d55c6a75b98aa1d1574a8293736bcc))
* **web:** stop the build hanging after it has finished ([d63835d](https://github.com/kaizenics/davflood/commit/d63835d45c56c5f7085a8571c0c9d607e5be443f))
* **web:** stop the hazard layer doubling when you zoom out ([f789668](https://github.com/kaizenics/davflood/commit/f78966814264a7562a468ab9f091778199411f92))
* **web:** stop the map hanging on "Loading the map…" ([5b66a2c](https://github.com/kaizenics/davflood/commit/5b66a2ccb4702397a32515f42deb8df14a70ea2f))
* **web:** stop the page scrolling out from under the app ([f1ec5e7](https://github.com/kaizenics/davflood/commit/f1ec5e7d02059348262a97ee66abbe6345927f93))


### Faster

* **web:** fetch hazard data per scenario instead of bundling all three ([bd9c892](https://github.com/kaizenics/davflood/commit/bd9c8920bbde8cbb2699a32011559d143da3bd57))


### Under the hood

* **native:** replace drawer/auth scaffold with map-first tabs ([f88b203](https://github.com/kaizenics/davflood/commit/f88b2035a7ffb25a25ea5b70d0e0d5809d9be15d))
* remove the server, auth, db and UI scaffold ([80b980e](https://github.com/kaizenics/davflood/commit/80b980e4dffb33bfe0ebec11230d038cf2ee6245))

## [1.5.1](https://github.com/kaizenics/davflood/compare/v1.5.0...v1.5.1) (2026-08-12)


### Fixed

* **ci:** check out before merging, and land releases under the maintainer ([e5588b2](https://github.com/kaizenics/davflood/commit/e5588b247defd0419b8a544fcf7618f9db4fbc8f))

## [1.5.0](https://github.com/kaizenics/davflood/compare/v1.4.1...v1.5.0) (2026-08-12)


### New

* **web:** a page for every barangay in Davao City ([9b7ebcf](https://github.com/kaizenics/davflood/commit/9b7ebcf34a1ae3dd63af6ec75934402ed45918ea))
* **web:** open flat, and let the reader ask for depth ([11ecbd0](https://github.com/kaizenics/davflood/commit/11ecbd01f7d57ad083a38a9c71f5b6702680d1a6))
* **web:** open on the worst case, not the middle one ([2111f8d](https://github.com/kaizenics/davflood/commit/2111f8d36e39b5d463ad19b7416f4495f466d6ae))
* **web:** show the tapped spot in all three storms at once ([31cb6fa](https://github.com/kaizenics/davflood/commit/31cb6fa898f014133fba3642a45288dd3cf406f9))


### Fixed

* **web:** let the map show through the hazard fills ([72f30cf](https://github.com/kaizenics/davflood/commit/72f30cf5ce276ff22b4f9fbdee447a0d4d741d30))
* **web:** make the hazard bands read again over satellite ([5918190](https://github.com/kaizenics/davflood/commit/59181903d0e4989c71434884d872cf715577f855))
* **web:** stop the hazard layer doubling when you zoom out ([f789668](https://github.com/kaizenics/davflood/commit/f78966814264a7562a468ab9f091778199411f92))

## [1.4.1](https://github.com/kaizenics/davflood/compare/v1.4.0...v1.4.1) (2026-08-12)


### Fixed

* **web:** draw a house on the save button, not a smudge ([b3b03ad](https://github.com/kaizenics/davflood/commit/b3b03adf9913884354919621ed2b2d59747249bb))

## [1.4.0](https://github.com/kaizenics/davflood/compare/v1.3.0...v1.4.0) (2026-08-12)


### New

* **web:** a share card, generated from the palette ([2ad196e](https://github.com/kaizenics/davflood/commit/2ad196e5a9846832cf9f7faf7e4c9bb7a2771f7f))
* **web:** answer the questions people actually ask, once ([ae33215](https://github.com/kaizenics/davflood/commit/ae33215aac212952fb09cb329bcad9d030447b7c))
* **web:** describe every page to search engines properly ([2d30612](https://github.com/kaizenics/davflood/commit/2d30612d2a3d2722934d9963f948a22a8be81d58))

## [1.3.0](https://github.com/kaizenics/davflood/compare/v1.2.0...v1.3.0) (2026-08-11)


### New

* **news:** say how long ago, down to the minute ([8e8f3ab](https://github.com/kaizenics/davflood/commit/8e8f3abb6ecd4494278da438414d3f55c607c7f1))
* **web:** offer to save a place from the pin, not the panel ([d5e3996](https://github.com/kaizenics/davflood/commit/d5e399619f0cfa8e2b14900934b3c728058fe4e5))
* **web:** say how high the tapped ground is ([4fb79a6](https://github.com/kaizenics/davflood/commit/4fb79a6a0b5e309c99b1791632450cb8d3b5d027))

## [1.2.0](https://github.com/kaizenics/davflood/compare/v1.1.0...v1.2.0) (2026-08-11)


### New

* **web:** save your place, and save the numbers to your phone ([675da72](https://github.com/kaizenics/davflood/commit/675da722df4371f7c33900fc4024308bb488d712))

## [1.1.0](https://github.com/kaizenics/davflood/compare/v1.0.0...v1.1.0) (2026-08-11)


### New

* **web:** read the safety copy in Bisaya and Tagalog ([45199cf](https://github.com/kaizenics/davflood/commit/45199cf66dd51aadbe9aba63c87af3e0bb2fa6bc))


### Fixed

* **web:** stop the page scrolling out from under the app ([f1ec5e7](https://github.com/kaizenics/davflood/commit/f1ec5e7d02059348262a97ee66abbe6345927f93))

## 1.0.0 (2026-08-11)


### ⚠ BREAKING CHANGES

* **web:** removes the sign-in, sign-up and dashboard routes, the oRPC client and the theme provider. The app has no accounts.
* removes all server, authentication and database code.
* **native:** removes authentication from the mobile app entirely. Deletes lib/auth-client.ts, utils/orpc.ts, components/sign-in.tsx and components/sign-up.tsx, and drops @naboflood/api, @orpc/client, @orpc/tanstack-query, @tanstack/react-form, better-auth and @better-auth/expo from its dependencies. packages/auth, packages/api, apps/server and apps/web are untouched — Phase 5 crowdsourced reports can restore this from history in one commit.

### New

* **ci:** add CI workflow for automated checks and builds ([d24859a](https://github.com/kaizenics/davflood/commit/d24859a1cc6e1e019f6175332317efbb155b1593))
* forecast the river, and carry local flood news ([8fe9d5b](https://github.com/kaizenics/davflood/commit/8fe9d5b19096b9b8d3bca1042119705423073189))
* **hazard:** add @naboflood/hazard shared domain package ([e78ae97](https://github.com/kaizenics/davflood/commit/e78ae977a67a0b307ecc099de3e9d516b36a7696))
* **hazard:** add a light theme with a separately derived hazard palette ([9873ee2](https://github.com/kaizenics/davflood/commit/9873ee2f8fb67968ac2e7fff4a899d56a7fb24e2))
* **hazard:** add hourly rainfall to the forecast model ([0164163](https://github.com/kaizenics/davflood/commit/016416326f050fe769ff23de8e8647fac4eaa1ed))
* **hazard:** add MapLibre base style and hazard layer specs ([c7c3920](https://github.com/kaizenics/davflood/commit/c7c39201ef3e99c25c567e7399aa544b17aed947))
* **hazard:** add Open-Meteo rainfall client ([d9a3f20](https://github.com/kaizenics/davflood/commit/d9a3f202060046676486c6a714dc9f90d100a60b))
* **hazard:** clip NOAH data to the real city outline, not a bounding box ([cf9afd5](https://github.com/kaizenics/davflood/commit/cf9afd55773ee4d6dac052b464cfae849ec47386))
* **hazard:** convert the real UP NOAH shapefiles into app GeoJSON ([45885ca](https://github.com/kaizenics/davflood/commit/45885ca337a4d5d3079f4028b400ecedc97e77e8))
* **hazard:** generate synthetic Panabo flood dataset ([2d4f1bd](https://github.com/kaizenics/davflood/commit/2d4f1bd7afb09cf66d9983adb04bc8f1461011da))
* **hazard:** move the hazard model from Panabo to Davao City ([e62dbc9](https://github.com/kaizenics/davflood/commit/e62dbc9301f7023f2af9cf3ee033f4f7f343ca65))
* **hazard:** replace the placeholder dataset with the real UP NOAH model ([6b38994](https://github.com/kaizenics/davflood/commit/6b389949c909a8337a9fa1ce5c2edb0a6e5fc947))
* **hazard:** satellite basemap, light cartography and tuned terrain ([74224df](https://github.com/kaizenics/davflood/commit/74224dfd4a7a9a1047ca99b88a43057ff94389d3))
* **hazard:** validate the map style against the MapLibre spec ([6fe2241](https://github.com/kaizenics/davflood/commit/6fe22417d8407800cf904f02dec8a299f7c44068))
* **native:** add 3D flood hazard map screen ([0fc8bdc](https://github.com/kaizenics/davflood/commit/0fc8bdc143eff59f8d78a19a4afaf302b131c047))
* **native:** add barangay search, learn and about screens ([e2f8e9f](https://github.com/kaizenics/davflood/commit/e2f8e9fa603c50ab7e71214f27a4f62128336060))
* **native:** add first-run onboarding ([9647d24](https://github.com/kaizenics/davflood/commit/9647d24e5a49c71d6685a375a1b7d00ba0262589))
* **native:** configure MapLibre, app identity and hazard theme tokens ([ac40e5f](https://github.com/kaizenics/davflood/commit/ac40e5fe288138581e66698a96fcda82c80a98a3))
* **news:** pin reported flooding to the barangay it happened in ([89e6a6c](https://github.com/kaizenics/davflood/commit/89e6a6cc5ec835655821b402c2d56904dde06147))
* **news:** read the publishers directly, and show their photographs ([1b0182a](https://github.com/kaizenics/davflood/commit/1b0182ab8927bf56fb5e0e5e9685fbcd4f2a3724))
* **news:** serve the news from a function, not a bot ([9884ecc](https://github.com/kaizenics/davflood/commit/9884ecc909d7749d1d6a87a8b687254c1db5d4cb))
* **news:** source the news from Google News, and ship a real file ([fbf05d0](https://github.com/kaizenics/davflood/commit/fbf05d08fbba236b55010e89096f424041864d2a))
* **skills:** tasteskill added ([8dc0b74](https://github.com/kaizenics/davflood/commit/8dc0b745d46a1f532e9e377883ed6fef6322db59))
* **web:** a page for every flood report ([c6ecc4c](https://github.com/kaizenics/davflood/commit/c6ecc4c4f2e10e550b5749db115b2940428d2975))
* **web:** add a basemap switcher and a hazard overlay toggle ([13d84a9](https://github.com/kaizenics/davflood/commit/13d84a91d9640ee177b533a5bb678312b7f550e2))
* **web:** add a shadcn dialog and an hourly rainfall area chart ([62db3e0](https://github.com/kaizenics/davflood/commit/62db3e0eb4fda8352b2e815c825459a8460a454c))
* **web:** add a theme toggle that remembers and respects the OS ([5f554f9](https://github.com/kaizenics/davflood/commit/5f554f9852af91b505eec40cc79478c569b6a974))
* **web:** add browser map preview harness at /map-preview ([b0d11ae](https://github.com/kaizenics/davflood/commit/b0d11ae94890a73221ef1f0740b42f0e9d39e417))
* **web:** add versioning and changelog functionality with release management ([411b94d](https://github.com/kaizenics/davflood/commit/411b94d3aa160e5279db411b1881d5521649c621))
* **web:** animate the reading slot between the city and one barangay ([f2c1820](https://github.com/kaizenics/davflood/commit/f2c1820feb6d89bb38a8846cc189cbcf4dc60ac9))
* **web:** build the flood map app ([2727fb8](https://github.com/kaizenics/davflood/commit/2727fb82f4a945e6af2326409ce533d90740cbf8))
* **web:** draw the way to shelter on our own map ([c61f9ac](https://github.com/kaizenics/davflood/commit/c61f9ac0d8443afc21b0835ec69491f44511cf84))
* **web:** extrude flood zones by depth and make the view angle adjustable ([4057097](https://github.com/kaizenics/davflood/commit/405709732f08f6334af39aee2a36bc81eaff025c))
* **web:** float the reading over the map ([2baf19f](https://github.com/kaizenics/davflood/commit/2baf19f90430298b8c549e73a678789d26a8056b))
* **web:** fly to a tapped barangay and drop a pin ([353a918](https://github.com/kaizenics/davflood/commit/353a918a87fbb0809efc1aabe644fa419c58fa7c))
* **web:** give the map the whole phone screen ([402f9c3](https://github.com/kaizenics/davflood/commit/402f9c30b33297d0c502d3eef3f197b1e243af0c))
* **web:** implement collapsible rainfall panel with animation ([b898c5d](https://github.com/kaizenics/davflood/commit/b898c5da90e8ddb422af619a8a3941bd8fd4360b))
* **web:** migrate to TanStack Start with static prerendering ([3caaa7f](https://github.com/kaizenics/davflood/commit/3caaa7f1837904f62ad6fa0fd9a56cf3e1663a36))
* **web:** move the masthead into the panel, drop the bar ([0383b1c](https://github.com/kaizenics/davflood/commit/0383b1c4d5160db3babd2018be4b50600feed279))
* **web:** one screen — every page is a panel beside the live map ([eb2b38a](https://github.com/kaizenics/davflood/commit/eb2b38a5e28d93fdbf2a9ba0e026f816cb8fe9a7))
* **web:** one shell — sidebar everywhere, header only on phones ([4ca2c4f](https://github.com/kaizenics/davflood/commit/4ca2c4fbcfe1f373ac477bddefb607a9b3e06fbd))
* **web:** open an hour-by-hour rainfall detail from each forecast day ([69a0219](https://github.com/kaizenics/davflood/commit/69a02198f5fba84df91e64cb52579e0524b126e7))
* **web:** put the map view controls on the map on phones ([dc90470](https://github.com/kaizenics/davflood/commit/dc904700349091e169d7c8ca2f81fb8e26ab3726))
* **web:** put the view controls on the map, and start on satellite ([f63103e](https://github.com/kaizenics/davflood/commit/f63103e362b6b6086de61de06973ed338084b0d9))
* **web:** rebrand the app and marketing site to DavFlood ([6b4499e](https://github.com/kaizenics/davflood/commit/6b4499e76d309eab3876b3e7f08bcb47edb6bef3))
* **web:** rebuild the map sidebar around a single reading ([7b650dd](https://github.com/kaizenics/davflood/commit/7b650ddd94c68c05812a521911791da374951734))
* **web:** redraw the wordmark around a waterline ([264d1dc](https://github.com/kaizenics/davflood/commit/264d1dc46151ab577984b3d4f631685faca3d945))
* **web:** refine guide and pin functionality on the map, update directions handling ([9241b93](https://github.com/kaizenics/davflood/commit/9241b93c50a1f69cb23f8a43534e8b49097038c6))
* **web:** rework the layout as a desktop website ([ca6a664](https://github.com/kaizenics/davflood/commit/ca6a66467bcea291a3259720580fc4b054df1306))
* **web:** set the interface in Manrope ([6e2b4e9](https://github.com/kaizenics/davflood/commit/6e2b4e9ec0cce20cbcfc3f37203dd53470678ca0))
* **web:** show where rain is falling, as rain ([45c0777](https://github.com/kaizenics/davflood/commit/45c07773128e3d65e66b50a876f5a41a76bd2a3b))
* **web:** somewhere to go, and directions to it ([77a8de5](https://github.com/kaizenics/davflood/commit/77a8de53403632018e462ac58cf0b68a562158f5))
* **web:** who to call, and what the rain means for where you tapped ([70bcf1a](https://github.com/kaizenics/davflood/commit/70bcf1a5eb1cbd400a25b60e7f41aca04b5ca774))
* **web:** work without a signal, and say which way is out ([4d1ba03](https://github.com/kaizenics/davflood/commit/4d1ba0345f3e47952c9d20588ccff13cd3a0105c))


### Fixed

* **hazard:** include barangays OSM maps only as a point ([2199c45](https://github.com/kaizenics/davflood/commit/2199c4505f9530e56332b969847c432dcccf8d7e))
* **hazard:** round off the shards Douglas-Peucker leaves in the polygons ([a70ded5](https://github.com/kaizenics/davflood/commit/a70ded56801c5621d420fa8e0ec8b2a8cf71251a))
* **native:** guard map operations against the pre-load window ([89f9402](https://github.com/kaizenics/davflood/commit/89f9402066dad9b788c7d7040a1775fc70be3909))
* **native:** persist the onboarding flag on web ([1d255d2](https://github.com/kaizenics/davflood/commit/1d255d2f5f75480c00c32a30c0cd0e396e519d25))
* **native:** render the map with maplibre-gl on web ([204d988](https://github.com/kaizenics/davflood/commit/204d9885d83053410c937fa77fd7d33500db3160))
* **native:** surface map failures instead of rendering a black rectangle ([23c5ef8](https://github.com/kaizenics/davflood/commit/23c5ef83ad6d0642af7492022760072fca9de05b))
* **web:** keep the four-day forecast on screen when it is dry ([58afd28](https://github.com/kaizenics/davflood/commit/58afd28efa2b9ec724a24d8a52b7a1698a88495a))
* **web:** make the map work in the production build ([73feec6](https://github.com/kaizenics/davflood/commit/73feec6bcfab7b873b5c82e60711d79e234aa36e))
* **web:** point MapLibre at a worker the bundler can actually serve ([0c310f1](https://github.com/kaizenics/davflood/commit/0c310f1a42e237e621d901e28c25dad8f4812f38))
* **web:** repair the mojibake in the map view controls ([48b3794](https://github.com/kaizenics/davflood/commit/48b37942f5d55c6a75b98aa1d1574a8293736bcc))
* **web:** stop the build hanging after it has finished ([d63835d](https://github.com/kaizenics/davflood/commit/d63835d45c56c5f7085a8571c0c9d607e5be443f))
* **web:** stop the map hanging on "Loading the map…" ([5b66a2c](https://github.com/kaizenics/davflood/commit/5b66a2ccb4702397a32515f42deb8df14a70ea2f))


### Faster

* **web:** fetch hazard data per scenario instead of bundling all three ([bd9c892](https://github.com/kaizenics/davflood/commit/bd9c8920bbde8cbb2699a32011559d143da3bd57))


### Under the hood

* **native:** replace drawer/auth scaffold with map-first tabs ([f88b203](https://github.com/kaizenics/davflood/commit/f88b2035a7ffb25a25ea5b70d0e0d5809d9be15d))
* remove the server, auth, db and UI scaffold ([80b980e](https://github.com/kaizenics/davflood/commit/80b980e4dffb33bfe0ebec11230d038cf2ee6245))

## Changelog

Written by release-please from the commit history — see
`.github/workflows/release.yml`. The site renders this file at /releases, so
the wording in a commit subject is wording the public reads.

Entries appear below once the first release PR is merged.
