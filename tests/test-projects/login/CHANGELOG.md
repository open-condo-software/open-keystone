# @keystonejs/cypress-project-login

## 7.0.0

### Major Changes

- Changed @keystonejs scope to @open-keystone

### Patch Changes

- Updated dependencies []:
  - @open-keystone/server-side-graphql-client@3.0.0
  - @open-keystone/adapter-prisma@4.0.0
  - @open-keystone/auth-password@7.0.0
  - @open-keystone/app-admin-ui@8.0.0
  - @open-keystone/list-plugins@9.0.0
  - @open-keystone/app-graphql@7.0.0
  - @open-keystone/app-static@6.0.0
  - @open-keystone/keystone@20.0.0
  - @open-keystone/session@9.0.0
  - @open-keystone/fields@23.0.0

## 6.0.5

### Patch Changes

- [#95](https://github.com/keystonejs/keystone-5/pull/95) [`c8ff78b95`](https://github.com/keystonejs/keystone-5/commit/c8ff78b95af5d56d44bbc11c51e7cf28b81323b4) Thanks [@bladey](https://github.com/bladey)! - Renamed branch `master` to `main`.

- Updated dependencies [[`c8ff78b95`](https://github.com/keystonejs/keystone-5/commit/c8ff78b95af5d56d44bbc11c51e7cf28b81323b4)]:
  - @keystonejs/adapter-prisma@3.2.2
  - @keystonejs/app-admin-ui@7.5.2
  - @keystonejs/app-graphql@6.3.2
  - @keystonejs/app-static@5.2.2
  - @keystonejs/auth-password@6.1.2
  - @keystonejs/fields@22.1.3
  - @keystonejs/keystone@19.3.3
  - @keystonejs/list-plugins@8.1.2
  - @keystonejs/server-side-graphql-client@2.1.2
  - @keystonejs/session@8.3.2

## 6.0.4

### Patch Changes

- [#95](https://github.com/keystonejs/keystone-5/pull/95) [`a890b0576`](https://github.com/keystonejs/keystone-5/commit/a890b057628b60c2d1870cc3f5afd8e87b03f7df) Thanks [@bladey](https://github.com/bladey)! - Renamed branch `master` to `main`.

- Updated dependencies [[`a890b0576`](https://github.com/keystonejs/keystone-5/commit/a890b057628b60c2d1870cc3f5afd8e87b03f7df)]:
  - @keystonejs/adapter-prisma@3.2.1
  - @keystonejs/app-admin-ui@7.5.1
  - @keystonejs/app-graphql@6.3.1
  - @keystonejs/app-static@5.2.1
  - @keystonejs/auth-password@6.1.1
  - @keystonejs/fields@22.1.2
  - @keystonejs/keystone@19.3.2
  - @keystonejs/list-plugins@8.1.1
  - @keystonejs/server-side-graphql-client@2.1.1
  - @keystonejs/session@8.3.1

## 6.0.3

### Patch Changes

- [`04bf1e4bb`](https://github.com/keystonejs/keystone-5/commit/04bf1e4bb0223f4e2e06664bbc9e95c51118eb84) [#2](https://github.com/keystonejs/keystone-5/pull/2) Thanks [@bladey](https://github.com/bladey)! - Updated repository URL in package.json.

- Updated dependencies [[`04bf1e4bb`](https://github.com/keystonejs/keystone-5/commit/04bf1e4bb0223f4e2e06664bbc9e95c51118eb84), [`f88f3976b`](https://github.com/keystonejs/keystone-5/commit/f88f3976b2d29d3bd3521d1ae2d9109a4a688cfc), [`26a9ce9b1`](https://github.com/keystonejs/keystone-5/commit/26a9ce9b1b495feb0f4660ff2d5cf54a4fa81b2d)]:
  - @keystonejs/adapter-prisma@3.1.0
  - @keystonejs/app-admin-ui@7.4.1
  - @keystonejs/app-graphql@6.2.2
  - @keystonejs/app-static@5.1.4
  - @keystonejs/auth-password@6.0.2
  - @keystonejs/fields@22.0.1
  - @keystonejs/keystone@19.2.1
  - @keystonejs/list-plugins@8.0.1
  - @keystonejs/server-side-graphql-client@2.0.1
  - @keystonejs/session@8.2.1

## 6.0.2

### Patch Changes

- Updated dependencies [[`b97216a65`](https://github.com/keystonejs/keystone-5/commit/b97216a6526fffcca8232d86b115c28cb19587bf), [`d8f64887f`](https://github.com/keystonejs/keystone-5/commit/d8f64887f2aa428ea8ac35d0efa50ce05534f40b), [`4035218df`](https://github.com/keystonejs/keystone-5/commit/4035218df390beff3d42c0d3fc21335230d8a60d), [`8d0be8a89`](https://github.com/keystonejs/keystone-5/commit/8d0be8a89e2d9b89826365f81f47b8d8863b93d0)]:
  - @keystonejs/fields@22.0.0
  - @keystonejs/adapter-prisma@3.0.1
  - @keystonejs/app-admin-ui@7.4.0
  - @keystonejs/keystone@19.2.0
  - @keystonejs/list-plugins@8.0.0
  - @keystonejs/server-side-graphql-client@2.0.0
  - @keystonejs/auth-password@6.0.1

## 6.0.1

### Patch Changes

- [`588be9ea1`](https://github.com/keystonejs/keystone-5/commit/588be9ea16ab5fb6e74f844b917ca8aeb91a9ac9) [#3222](https://github.com/keystonejs/keystone-5/pull/3222) Thanks [@timleslie](https://github.com/timleslie)! - Removed support for multiple database adapters in a single `Keystone` system. The `adapters` and `defaultAdapter` config options were removed from the `Keystone()` constructor. If you were accessing the adapter object via `keystone.adapters.KnexAdapter` or `keystone.adapters.MongooseAdapter` you should now simply access `keystone.adapter`.

- Updated dependencies [[`a886039a1`](https://github.com/keystonejs/keystone-5/commit/a886039a1fc17c9b60b2955f0e58916ab1c3d7bf), [`680169cad`](https://github.com/keystonejs/keystone-5/commit/680169cad62dd889ec95961cba9df3b4d012887f), [`621db113a`](https://github.com/keystonejs/keystone-5/commit/621db113a6a579cc3da19ae9cef50dc63ac8ca55), [`749d1c86c`](https://github.com/keystonejs/keystone-5/commit/749d1c86c89690ef10014a4a0a12641eb24bfe1d), [`588be9ea1`](https://github.com/keystonejs/keystone-5/commit/588be9ea16ab5fb6e74f844b917ca8aeb91a9ac9)]:
  - @keystonejs/adapter-prisma@3.0.0
  - @keystonejs/fields@21.1.0
  - @keystonejs/session@8.2.0
  - @keystonejs/keystone@19.0.0

## 6.0.0

### Major Changes

- [`1813ec36e`](https://github.com/keystonejs/keystone-5/commit/1813ec36ee3d9f0e409c5b97e5a967ff803e0bf9) [#4693](https://github.com/keystonejs/keystone-5/pull/4693) Thanks [@timleslie](https://github.com/timleslie)! - Convert cypress test projects to use the `PrismaAdapter` rather than the `MongooseAdapter`.

### Patch Changes

- Updated dependencies [[`6b95cb6e4`](https://github.com/keystonejs/keystone-5/commit/6b95cb6e4d5bea3a87e22765d5fcf31db2fc31ae), [`fc2b7101f`](https://github.com/keystonejs/keystone-5/commit/fc2b7101f35f20e4d729269a005816546bb37464), [`e7d4d54e5`](https://github.com/keystonejs/keystone-5/commit/e7d4d54e5b94e6b376d6eab28a0f2b074f2c95ed), [`a62a2d996`](https://github.com/keystonejs/keystone-5/commit/a62a2d996f1080051f7962b7063ae37d7e8b7e63)]:
  - @keystonejs/adapter-prisma@2.0.0
  - @keystonejs/fields@21.0.2

## 5.1.25

### Patch Changes

- Updated dependencies [[`1200c3562`](https://github.com/keystonejs/keystone-5/commit/1200c356272ae8deea9da4267ce62c1449498e95), [`cf2819544`](https://github.com/keystonejs/keystone-5/commit/cf2819544426def260ada5eb18fdc9b8a01e9438), [`1200c3562`](https://github.com/keystonejs/keystone-5/commit/1200c356272ae8deea9da4267ce62c1449498e95), [`0dfb63414`](https://github.com/keystonejs/keystone-5/commit/0dfb6341412c3c7ae60f069d37fa96e0c9adc900)]:
  - @keystonejs/keystone@18.0.0
  - @keystonejs/app-graphql@6.2.0
  - @keystonejs/adapter-mongoose@10.1.1
  - @keystonejs/auth-password@6.0.0

## 5.1.24

### Patch Changes

- Updated dependencies [[`364ac9254`](https://github.com/keystonejs/keystone-5/commit/364ac9254735befd2d4804789bb62464bb51ee5b), [`841be0bc9`](https://github.com/keystonejs/keystone-5/commit/841be0bc9d192cf64399231a543a9ba9ff41b9a0), [`f8873064b`](https://github.com/keystonejs/keystone-5/commit/f8873064b667d62001afe7950e33d019bcff7be3), [`d329f07a5`](https://github.com/keystonejs/keystone-5/commit/d329f07a5ce7ebf5d658a7f90334ba4372a2a72d)]:
  - @keystonejs/adapter-mongoose@10.1.0
  - @keystonejs/fields@21.0.0
  - @keystonejs/app-admin-ui@7.3.12
  - @keystonejs/auth-password@5.1.18
  - @keystonejs/list-plugins@7.1.5

## 5.1.23

### Patch Changes

- Updated dependencies [[`a5e40e6c4`](https://github.com/keystonejs/keystone-5/commit/a5e40e6c4af1ab38cc2079a0f6e27d39d6b7d546), [`2d660b2a1`](https://github.com/keystonejs/keystone-5/commit/2d660b2a1dd013787e022cad3a0c70dbe08c60da), [`3dd5c570a`](https://github.com/keystonejs/keystone-5/commit/3dd5c570a27d0795a689407d96fc9623c90a66df), [`2b682d2c1`](https://github.com/keystonejs/keystone-5/commit/2b682d2c1b6dc798a8913e4d2e09767c7a2980ac)]:
  - @keystonejs/fields@20.0.0
  - @keystonejs/adapter-mongoose@10.0.1
  - @keystonejs/keystone@17.1.1
  - @keystonejs/app-admin-ui@7.3.9
  - @keystonejs/auth-password@5.1.17
  - @keystonejs/list-plugins@7.1.4

## 5.1.22

### Patch Changes

- Updated dependencies [[`e5efd0ef3`](https://github.com/keystonejs/keystone-5/commit/e5efd0ef3d6943534cb6c728afe5dbf0caf43e74), [`e5efd0ef3`](https://github.com/keystonejs/keystone-5/commit/e5efd0ef3d6943534cb6c728afe5dbf0caf43e74)]:
  - @keystonejs/adapter-mongoose@10.0.0
  - @keystonejs/fields@19.0.0
  - @keystonejs/app-admin-ui@7.3.8
  - @keystonejs/auth-password@5.1.16
  - @keystonejs/list-plugins@7.1.3

## 5.1.21

### Patch Changes

- Updated dependencies [[`01b79349e`](https://github.com/keystonejs/keystone-5/commit/01b79349e625870193933aa044bdf27f8c75753e), [`48623ae44`](https://github.com/keystonejs/keystone-5/commit/48623ae44568bae1af2861003fa9922a0118cc57), [`a02e69987`](https://github.com/keystonejs/keystone-5/commit/a02e69987902cfde38d820e68cb24b7a20ca1f6f), [`966b5bc70`](https://github.com/keystonejs/keystone-5/commit/966b5bc7003e0f580528c4dcd46647cc4124b592), [`f70c9f1ba`](https://github.com/keystonejs/keystone-5/commit/f70c9f1ba7452b54a15ab71943a3777d5b6dade4), [`cc56990f2`](https://github.com/keystonejs/keystone-5/commit/cc56990f2e9a4ecf0c112362e8d472b9286f76bc), [`df0687184`](https://github.com/keystonejs/keystone-5/commit/df068718456d23819a7cae491870be4560b2010d), [`cc56990f2`](https://github.com/keystonejs/keystone-5/commit/cc56990f2e9a4ecf0c112362e8d472b9286f76bc)]:
  - @keystonejs/app-admin-ui@7.3.7
  - @keystonejs/fields@18.0.0
  - @keystonejs/adapter-mongoose@9.0.8
  - @keystonejs/keystone@17.0.0
  - @keystonejs/auth-password@5.1.15
  - @keystonejs/list-plugins@7.1.2

## 5.1.20

### Patch Changes

- [`f228644f2`](https://github.com/keystonejs/keystone-5/commit/f228644f2d39875f45daa93dabfb992f081eaa4a) [#3679](https://github.com/keystonejs/keystone-5/pull/3679) Thanks [@timleslie](https://github.com/timleslie)! - Updated dependency `cypress-file-upload` to `^4.1.1`.

* [`b715776e2`](https://github.com/keystonejs/keystone-5/commit/b715776e245b18fdbf06bb576704ad619c6e3612) [#3561](https://github.com/keystonejs/keystone-5/pull/3561) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `cypress` to `^5.3.0`.

* Updated dependencies [[`92b34a74e`](https://github.com/keystonejs/keystone-5/commit/92b34a74e699e3a101f53064e52932b7daeccbfc), [`b32f006ad`](https://github.com/keystonejs/keystone-5/commit/b32f006ad283f8aa1911f55bbecac9942f3f9f25), [`6f42b0a9d`](https://github.com/keystonejs/keystone-5/commit/6f42b0a9d231049f9e7523eb78ec621d9c9d6df9), [`06dffc42b`](https://github.com/keystonejs/keystone-5/commit/06dffc42b08062e3166880146c8fb606493ead12), [`27783bbca`](https://github.com/keystonejs/keystone-5/commit/27783bbca3b1c5ff05402738c14ffa8db73e542b), [`7a1f8bbdc`](https://github.com/keystonejs/keystone-5/commit/7a1f8bbdcdf68c9579e17db77fa826e811abcab4), [`83007be79`](https://github.com/keystonejs/keystone-5/commit/83007be798ebd751d7eb708cde366dc35999af72), [`a14283b9c`](https://github.com/keystonejs/keystone-5/commit/a14283b9c9d80e8a38adede567695bf7e89cbcb9), [`38e3ad9c3`](https://github.com/keystonejs/keystone-5/commit/38e3ad9c3e7124d06f11c7046821c857cf7f9ad2), [`6f42b0a9d`](https://github.com/keystonejs/keystone-5/commit/6f42b0a9d231049f9e7523eb78ec621d9c9d6df9), [`5c1e55721`](https://github.com/keystonejs/keystone-5/commit/5c1e5572134fa93c9aefbb537676e30cafd0e7d9), [`304701d7c`](https://github.com/keystonejs/keystone-5/commit/304701d7c23e98c8dc40c0f3f5512a0370107c06), [`7a1f8bbdc`](https://github.com/keystonejs/keystone-5/commit/7a1f8bbdcdf68c9579e17db77fa826e811abcab4), [`d95010eea`](https://github.com/keystonejs/keystone-5/commit/d95010eea35f40274f412dad5c2fed6b16ae6c60), [`aa5b4aa26`](https://github.com/keystonejs/keystone-5/commit/aa5b4aa269eebc6931d30f6eddc315805c1f4fef), [`b6e160678`](https://github.com/keystonejs/keystone-5/commit/b6e160678b449707261a54a9d565b91663784831), [`104232785`](https://github.com/keystonejs/keystone-5/commit/104232785aac856be6a3ba55f8fa0fd8357237ed), [`287e031fa`](https://github.com/keystonejs/keystone-5/commit/287e031facafe66ef71b0f6d6ee558904251589f), [`7956d5da0`](https://github.com/keystonejs/keystone-5/commit/7956d5da00197dc11f5d54f7870b8fa72c05a3c0)]:
  - @keystonejs/app-admin-ui@7.3.6
  - @keystonejs/fields@17.1.3
  - @keystonejs/adapter-mongoose@9.0.7
  - @keystonejs/keystone@16.0.0
  - @keystonejs/app-graphql@6.1.3

## 5.1.19

### Patch Changes

- [`a4db2dd88`](https://github.com/keystonejs/keystone-5/commit/a4db2dd884a3f3c791443497dce846275bb303d4) [#3594](https://github.com/keystonejs/keystone-5/pull/3594) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `pino-colada` to `^2.1.0`.

- Updated dependencies [[`8b0fd66bb`](https://github.com/keystonejs/keystone-5/commit/8b0fd66bbd73a99a4ed321ce737b5dc33e2d11d3), [`4f6883dc3`](https://github.com/keystonejs/keystone-5/commit/4f6883dc38962805f96256f9fdf42fb77bb3326a), [`dd49d2c04`](https://github.com/keystonejs/keystone-5/commit/dd49d2c040ea8fb8dfc36d2e556be88ca1b74b15), [`d7eac6629`](https://github.com/keystonejs/keystone-5/commit/d7eac662956fc2dffd9ea5cfedf60e51ecc1b80d), [`8bd44758a`](https://github.com/keystonejs/keystone-5/commit/8bd44758ac742c95f42151c9fbc16700b698e8e4), [`8cae7cff5`](https://github.com/keystonejs/keystone-5/commit/8cae7cff513187ec6e740c4b17afb2b753fe625a), [`77aa2d7d1`](https://github.com/keystonejs/keystone-5/commit/77aa2d7d156a83759a7f3c26e8c5bd019966b054), [`7c47967d3`](https://github.com/keystonejs/keystone-5/commit/7c47967d3f8a6e0026f9cd0108ff1dafc8d331b9), [`c08200087`](https://github.com/keystonejs/keystone-5/commit/c082000871947eb0a2415ac7355c89bc7b277383), [`d07f6bfb6`](https://github.com/keystonejs/keystone-5/commit/d07f6bfb6b3bd65036c2030d2758abdf4eca1a9e), [`fe054e53e`](https://github.com/keystonejs/keystone-5/commit/fe054e53e71f13a69af1d6dd2a1cd8c68bb31059), [`379c78240`](https://github.com/keystonejs/keystone-5/commit/379c78240d788875d97642e1f53120818ad64aff)]:
  - @keystonejs/server-side-graphql-client@1.1.2
  - @keystonejs/app-admin-ui@7.3.5
  - @keystonejs/fields@17.1.2
  - @keystonejs/keystone@15.0.0
  - @keystonejs/adapter-mongoose@9.0.6

## 5.1.18

### Patch Changes

- [`39145cf53`](https://github.com/keystonejs/keystone-5/commit/39145cf53888e33772323dc6749b6564391b0e0b) [#3515](https://github.com/keystonejs/keystone-5/pull/3515) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `mocha` to `^7.2.0`.

* [`31959b7cd`](https://github.com/keystonejs/keystone-5/commit/31959b7cd61725b27cfdc5191c3237bead363eaf) [#3483](https://github.com/keystonejs/keystone-5/pull/3483) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `cypress-multi-reporters` to `^1.4.0`.

- [`b85c5ea42`](https://github.com/keystonejs/keystone-5/commit/b85c5ea42c45cfe4c30b144aec568fd1ce477c38) [#3589](https://github.com/keystonejs/keystone-5/pull/3589) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `mocha-junit-reporter` to `2.0.0`.

* [`3456d2e4f`](https://github.com/keystonejs/keystone-5/commit/3456d2e4f28b03b4e1f4dcf4fb734690336da2e3) [#3535](https://github.com/keystonejs/keystone-5/pull/3535) Thanks [@MadeByMike](https://github.com/MadeByMike)! - Moved all test projects and settings into a `tests/` folder.

- [`5bed4db02`](https://github.com/keystonejs/keystone-5/commit/5bed4db0265e79569d60ee34afaa90169a581b58) [#3482](https://github.com/keystonejs/keystone-5/pull/3482) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `cypress-file-upload` to `^3.5.3`.

* [`01af3d21c`](https://github.com/keystonejs/keystone-5/commit/01af3d21cfd9db9c1564c783f25ce39d6d429f0a) [#3588](https://github.com/keystonejs/keystone-5/pull/3588) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `mocha` to `8.1.3`.

- [`98c8dbf4e`](https://github.com/keystonejs/keystone-5/commit/98c8dbf4ef722aad6eb27197722aa9d0ac169a93) [#3480](https://github.com/keystonejs/keystone-5/pull/3480) Thanks [@renovate](https://github.com/apps/renovate)! - Updated dependency `cypress` to `^4.12.1`.

- Updated dependencies [[`e8e2baa7b`](https://github.com/keystonejs/keystone-5/commit/e8e2baa7b1a9330cb483c2f30682d64f857d314c), [`cd15192cd`](https://github.com/keystonejs/keystone-5/commit/cd15192cdae5e476f64a257c196ca569a9440d5a), [`7bfdb79ee`](https://github.com/keystonejs/keystone-5/commit/7bfdb79ee43235418f098e5fe7412968dcf6c397), [`5fb75bab6`](https://github.com/keystonejs/keystone-5/commit/5fb75bab638c59ccf690c46d862b9801bf1d28f6), [`d500613d8`](https://github.com/keystonejs/keystone-5/commit/d500613d8917e3cbcea2817501d607eddd3b1a8d), [`6c97a5534`](https://github.com/keystonejs/keystone-5/commit/6c97a5534e8a18d15aeac8b0471810fdd4d04f80), [`729e897e6`](https://github.com/keystonejs/keystone-5/commit/729e897e689f2673f38d6c0caf22e7cee7ee8ff3), [`34fcc7052`](https://github.com/keystonejs/keystone-5/commit/34fcc7052a24db61f1f2f12c46110c060934f4ca), [`d3a4f9263`](https://github.com/keystonejs/keystone-5/commit/d3a4f9263de0d11a1613e420f660eccc2a48172d), [`40b751ad6`](https://github.com/keystonejs/keystone-5/commit/40b751ad6f09aec137ef42df10fdbb1240173afb), [`c3488c5e8`](https://github.com/keystonejs/keystone-5/commit/c3488c5e88628b15eb9fe804551c3c5c44c07e0f), [`e62b3308b`](https://github.com/keystonejs/keystone-5/commit/e62b3308bd841b5f58ac9fa1f84707f9187fda6b), [`7036585f2`](https://github.com/keystonejs/keystone-5/commit/7036585f25c3b690b7a6fd04c39b5b781ff5bcd9), [`2e6a06202`](https://github.com/keystonejs/keystone-5/commit/2e6a06202299b36c36fd3efd895f2280479eac31), [`a42ee3a30`](https://github.com/keystonejs/keystone-5/commit/a42ee3a306c899a7ae46909fe132522cbeff7812), [`d71f98791`](https://github.com/keystonejs/keystone-5/commit/d71f987917509a206b1e0a994dbc6641a7cf4e06), [`438051442`](https://github.com/keystonejs/keystone-5/commit/4380514421020f4418a9f966c9fec60e014478b9), [`b3aa85031`](https://github.com/keystonejs/keystone-5/commit/b3aa850311cbc1622568f69f9cb4b9f46ab9db22), [`518718e19`](https://github.com/keystonejs/keystone-5/commit/518718e197d0a2d723c8e184552ddd5d8e165f12), [`16fba3b98`](https://github.com/keystonejs/keystone-5/commit/16fba3b98271410e570a370f610da7cd0686f294), [`a34341387`](https://github.com/keystonejs/keystone-5/commit/a343413874f9611ad17ec39ff6175664f8a14bb6), [`28b88abd3`](https://github.com/keystonejs/keystone-5/commit/28b88abd369f0df12eae72107db7c24323eda4b5)]:
  - @keystonejs/app-admin-ui@7.3.4
  - @keystonejs/app-graphql@6.1.2
  - @keystonejs/fields@17.1.1
  - @keystonejs/keystone@14.0.2
  - @keystonejs/adapter-mongoose@9.0.5
  - @keystonejs/list-plugins@7.1.1

## 5.1.17

### Patch Changes

- [`6cb4476ff`](https://github.com/keystonejs/keystone-5/commit/6cb4476ff15923933862c1cd7d4b1ade794106c6) [#3481](https://github.com/keystonejs/keystone-5/pull/3481) Thanks [@Noviny](https://github.com/Noviny)! - Updated dependencies through a major version - this shouldn't require change by consumers.

* [`5935b89f8`](https://github.com/keystonejs/keystone-5/commit/5935b89f8862b36f14d09da68f056f759a860f3e) [#3477](https://github.com/keystonejs/keystone-5/pull/3477) Thanks [@Noviny](https://github.com/Noviny)! - Updating dependencies:

  These changes bring the keystone dev experience inline with installing keystone from npm :D

- [`db0797f7f`](https://github.com/keystonejs/keystone-5/commit/db0797f7f442c2c42cc941633930de527c722f48) [#3465](https://github.com/keystonejs/keystone-5/pull/3465) Thanks [@timleslie](https://github.com/timleslie)! - Removed unused body-parser dependency.

- Updated dependencies [[`6cb4476ff`](https://github.com/keystonejs/keystone-5/commit/6cb4476ff15923933862c1cd7d4b1ade794106c6), [`5935b89f8`](https://github.com/keystonejs/keystone-5/commit/5935b89f8862b36f14d09da68f056f759a860f3e), [`db0797f7f`](https://github.com/keystonejs/keystone-5/commit/db0797f7f442c2c42cc941633930de527c722f48), [`ac44568f9`](https://github.com/keystonejs/keystone-5/commit/ac44568f91fd54ccbc39accf83bcfb3276ce1a72), [`64d745013`](https://github.com/keystonejs/keystone-5/commit/64d745013fd2cccc1fb14c4f02ac84778b5c9abc), [`877a5a90d`](https://github.com/keystonejs/keystone-5/commit/877a5a90d608f0a13b6c0ea103cb96e3ac2caacc), [`483b20ec5`](https://github.com/keystonejs/keystone-5/commit/483b20ec53ff89f1d026c0495fdae5df60a7cf59), [`0fc878fa9`](https://github.com/keystonejs/keystone-5/commit/0fc878fa918c3196196f943f195ffaa62fce504b), [`ea367f759`](https://github.com/keystonejs/keystone-5/commit/ea367f7594f47efc3528d9917cce010b3a16bf4d), [`69d627813`](https://github.com/keystonejs/keystone-5/commit/69d627813adfc10d29707f5c882ca15621de12a5), [`dc689f9ac`](https://github.com/keystonejs/keystone-5/commit/dc689f9ac8e213137dfed9e81992bbe4318b44ae), [`07e246d15`](https://github.com/keystonejs/keystone-5/commit/07e246d15586dede7fa9a04bcc13020c8c5c3a25), [`7f04d9dd2`](https://github.com/keystonejs/keystone-5/commit/7f04d9dd21ad792b540d9e0a5d83356c091597ad), [`0153168d7`](https://github.com/keystonejs/keystone-5/commit/0153168d73ce8cd7ede4eb9c8518e5e2bf859709)]:
  - @keystonejs/adapter-mongoose@9.0.4
  - @keystonejs/app-static@5.1.3
  - @keystonejs/fields@17.1.0
  - @keystonejs/keystone@14.0.1
  - @keystonejs/app-admin-ui@7.3.3
  - @keystonejs/session@8.1.1
  - @keystonejs/app-graphql@6.1.1

## 5.1.16

### Patch Changes

- Updated dependencies [[`25f50dadc`](https://github.com/keystonejs/keystone-5/commit/25f50dadc07d888de18d485244c84d17462dce2e), [`d38c9174f`](https://github.com/keystonejs/keystone-5/commit/d38c9174f8146ad6e268be87cf5d54d5074bc593), [`fba90ac5d`](https://github.com/keystonejs/keystone-5/commit/fba90ac5db7328e952c44cb7c0bb8db76dd954b8), [`e8b2e4772`](https://github.com/keystonejs/keystone-5/commit/e8b2e477206acffb143f19fb14be1e3b4cd0eb91), [`84116f7c7`](https://github.com/keystonejs/keystone-5/commit/84116f7c75637a60936a130f104ac748c445acb5), [`f714ac1e2`](https://github.com/keystonejs/keystone-5/commit/f714ac1e2c49ef44d756e35042bdb7da6db589a7), [`c243839c1`](https://github.com/keystonejs/keystone-5/commit/c243839c12abc8cffe8ff788fe57dcb880dc3a41)]:
  - @keystonejs/keystone@14.0.0
  - @keystonejs/fields@17.0.0
  - @keystonejs/app-admin-ui@7.3.2
  - @keystonejs/list-plugins@7.1.0
  - @keystonejs/adapter-mongoose@9.0.3
  - @keystonejs/auth-password@5.1.14

## 5.1.15

### Patch Changes

- Updated dependencies [[`d38a41f25`](https://github.com/keystonejs/keystone-5/commit/d38a41f25a1b4c90c05d2fb85116dc385d4ee77a), [`845b6a21b`](https://github.com/keystonejs/keystone-5/commit/845b6a21b62e615135eb738ad332fc035b93191b), [`5ede731fc`](https://github.com/keystonejs/keystone-5/commit/5ede731fc58a79e7322b852bdd2d971ece45281e), [`1a89bbdc6`](https://github.com/keystonejs/keystone-5/commit/1a89bbdc6b2122a5c8217e6f6c750f7cfb69dc2c), [`f8d4b175b`](https://github.com/keystonejs/keystone-5/commit/f8d4b175bbc29962569acb24b34c29c44b61791f), [`318e39b74`](https://github.com/keystonejs/keystone-5/commit/318e39b74b2fa3152d4ff09bccec93238e8345ef), [`1d9068770`](https://github.com/keystonejs/keystone-5/commit/1d9068770d03658954044c530e56e66169667e25), [`b0af7d5ba`](https://github.com/keystonejs/keystone-5/commit/b0af7d5baa6ceea8d80215afa290fd76240ee823), [`694f3acfb`](https://github.com/keystonejs/keystone-5/commit/694f3acfb9faa78aebfcf48cf711165560f16ff7), [`149d6fd6f`](https://github.com/keystonejs/keystone-5/commit/149d6fd6ff057c17570346063c173376769dcc79), [`e44102e9f`](https://github.com/keystonejs/keystone-5/commit/e44102e9f7f770b1528d642d763ccf9f88f3cbb1), [`7f17cb22f`](https://github.com/keystonejs/keystone-5/commit/7f17cb22f2ad49d3e5110f68cbb29447a16aa7a7), [`7650ecd3e`](https://github.com/keystonejs/keystone-5/commit/7650ecd3e60b52983015ac0058b8b0066b074e1e), [`ed2f8c31b`](https://github.com/keystonejs/keystone-5/commit/ed2f8c31b13eadb39a045cc351777add81621ede)]:
  - @keystonejs/fields@16.0.0
  - @keystonejs/keystone@13.1.0
  - @keystonejs/server-side-graphql-client@1.1.0
  - @keystonejs/session@8.1.0
  - @keystonejs/app-admin-ui@7.3.0
  - @keystonejs/list-plugins@7.0.5
  - @keystonejs/auth-password@5.1.13

## 5.1.14

### Patch Changes

- [`acaf19cd9`](https://github.com/keystonejs/keystone-5/commit/acaf19cd9679861234e67f9e130aea83d052f01e) [#3301](https://github.com/keystonejs/keystone-5/pull/3301) Thanks [@MadeByMike](https://github.com/MadeByMike)! - No functional changes. Update all internal usages of `keystone.createItems` to the new `createItems` function.

- Updated dependencies [[`af5171563`](https://github.com/keystonejs/keystone-5/commit/af51715637433bcdd2538835c98ac71a8eb86122), [`086b6baec`](https://github.com/keystonejs/keystone-5/commit/086b6baecdb8730bd7ae7001a96ae881fb13bac2), [`271f1a40b`](https://github.com/keystonejs/keystone-5/commit/271f1a40b97e03aaa00ce920a6515b8f18669428), [`acaf19cd9`](https://github.com/keystonejs/keystone-5/commit/acaf19cd9679861234e67f9e130aea83d052f01e), [`22b4a5c1a`](https://github.com/keystonejs/keystone-5/commit/22b4a5c1a13c3cca47190467be9d56e836f180f1), [`7da9d67d7`](https://github.com/keystonejs/keystone-5/commit/7da9d67d7d481c44a81406c6b34540a3f0a8340d), [`afe661e60`](https://github.com/keystonejs/keystone-5/commit/afe661e607539df13584d460e1016ba0fa883cb8), [`04f9be03d`](https://github.com/keystonejs/keystone-5/commit/04f9be03de7fe82035205379208511c6e49890b3), [`ef7074977`](https://github.com/keystonejs/keystone-5/commit/ef70749775ce1565eafd7f94c3d7438c8ebd474e), [`b53b6fe5a`](https://github.com/keystonejs/keystone-5/commit/b53b6fe5a8cbefba20008ca54ee3fe4b346e8497), [`e07c42d4e`](https://github.com/keystonejs/keystone-5/commit/e07c42d4ec75d5703bec4a2e419a42d18bed90ca), [`5a3849806`](https://github.com/keystonejs/keystone-5/commit/5a3849806d00e62b722461d02f6e4639bc45c1eb), [`086b6baec`](https://github.com/keystonejs/keystone-5/commit/086b6baecdb8730bd7ae7001a96ae881fb13bac2), [`24af20b38`](https://github.com/keystonejs/keystone-5/commit/24af20b38ab89a452edc7a060c9bc936cda55a4a), [`c3883e01c`](https://github.com/keystonejs/keystone-5/commit/c3883e01c01b83cf5938de9bebf2dd68f4861364), [`fd2b8d1cf`](https://github.com/keystonejs/keystone-5/commit/fd2b8d1cf0b23b177951d65006a0d0faf666a5d6), [`2e10b1083`](https://github.com/keystonejs/keystone-5/commit/2e10b1083c0ab3925b877f16543c3d302f618313)]:
  - @keystonejs/fields@15.0.0
  - @keystonejs/keystone@13.0.0
  - @keystonejs/server-side-graphql-client@1.0.0
  - @keystonejs/app-admin-ui@7.2.0
  - @keystonejs/app-graphql@6.1.0
  - @keystonejs/auth-password@5.1.12
  - @keystonejs/list-plugins@7.0.4
  - @keystonejs/adapter-mongoose@9.0.1

## 5.1.13

### Patch Changes

- [`49984caae`](https://github.com/keystonejs/keystone-5/commit/49984caaec803ed86b027c9634ac6b3f671e9ba7) [#3227](https://github.com/keystonejs/keystone-5/pull/3227) Thanks [@Vultraz](https://github.com/Vultraz)! - Moved `name` config option from Keystone constructor to Admin UI constructor.

- Updated dependencies [[`5ad84ccd8`](https://github.com/keystonejs/keystone-5/commit/5ad84ccd8d008188e293629e90a4d7e7fde55333), [`61cdafe20`](https://github.com/keystonejs/keystone-5/commit/61cdafe20e0a22b5a1f9b6a2dcc4aefa45a26902), [`8480f889a`](https://github.com/keystonejs/keystone-5/commit/8480f889a492d83ee805f19877d49fd112117939), [`e710cd445`](https://github.com/keystonejs/keystone-5/commit/e710cd445bfb71317ca38622cc3795da61d13dff), [`49984caae`](https://github.com/keystonejs/keystone-5/commit/49984caaec803ed86b027c9634ac6b3f671e9ba7), [`136cb505c`](https://github.com/keystonejs/keystone-5/commit/136cb505ce11931de7fc470debe438e335588781), [`02f069f0b`](https://github.com/keystonejs/keystone-5/commit/02f069f0b6e28ccfe6d5cdeb59ab01bde27a655e), [`e6117d259`](https://github.com/keystonejs/keystone-5/commit/e6117d259e0ceeacc0b42e3db0bd39dd39537090), [`4b95d8a46`](https://github.com/keystonejs/keystone-5/commit/4b95d8a46d53d32b2873e350716311441cd37262), [`e114894d1`](https://github.com/keystonejs/keystone-5/commit/e114894d1bbcea8940cf14486fc336aa8d112da7), [`e63b9f25a`](https://github.com/keystonejs/keystone-5/commit/e63b9f25adb64cecf0f65c6f97fe30c95e483996), [`5fc97cbf4`](https://github.com/keystonejs/keystone-5/commit/5fc97cbf4489587a3a8cb38c04ba81fc2cb1fc5a), [`56e1798d6`](https://github.com/keystonejs/keystone-5/commit/56e1798d6815723cfba01e6d7dc6b4fe73d4447b), [`06f86c6f5`](https://github.com/keystonejs/keystone-5/commit/06f86c6f5c573411f0efda565a269d1d7ccb3c66), [`0cbb7e7b0`](https://github.com/keystonejs/keystone-5/commit/0cbb7e7b096c2a99685631a601fce7273d03cc70), [`81b4df318`](https://github.com/keystonejs/keystone-5/commit/81b4df3182fc63c583e3fae5c05c528b678cab95), [`e6909b003`](https://github.com/keystonejs/keystone-5/commit/e6909b0037c9d3dc4fc6131da7968a424ce02be9), [`c9ca62876`](https://github.com/keystonejs/keystone-5/commit/c9ca628765f1ecb599c8556de2d31567ddf12504), [`3ce644d5f`](https://github.com/keystonejs/keystone-5/commit/3ce644d5f2b6e674adb2f155c0e729536079347a), [`622cc7d69`](https://github.com/keystonejs/keystone-5/commit/622cc7d6976ecb71f5b135c931ac0fcb4afdb1c7), [`51aef1ef0`](https://github.com/keystonejs/keystone-5/commit/51aef1ef06a89422e89a6118b7820848d5970669)]:
  - @keystonejs/keystone@12.0.0
  - @keystonejs/session@8.0.0
  - @keystonejs/app-admin-ui@7.1.0
  - @keystonejs/fields@14.0.0
  - @keystonejs/adapter-mongoose@9.0.0
  - @keystonejs/app-graphql@6.0.0
  - @keystonejs/auth-password@5.1.11
  - @keystonejs/list-plugins@7.0.3

## 5.1.12

### Patch Changes

- Updated dependencies [[`c235e34c7`](https://github.com/keystonejs/keystone-5/commit/c235e34c7a72cd05b05b3d1af08c93c1e98a8e91), [`dec3d336a`](https://github.com/keystonejs/keystone-5/commit/dec3d336adbe8156722fbe65f315a57b2f5c08e7), [`78a5d5a45`](https://github.com/keystonejs/keystone-5/commit/78a5d5a457f80bba592e5a81056125b11469a5a8), [`2e5a93dee`](https://github.com/keystonejs/keystone-5/commit/2e5a93dee5be11bf020c1397c7653bdf07a90d24), [`1c69f4dc8`](https://github.com/keystonejs/keystone-5/commit/1c69f4dc8ab1eb23bc0a34850f48a51f2e9f1dce), [`b693b2fa8`](https://github.com/keystonejs/keystone-5/commit/b693b2fa8a391d7f5bcfbea11061679bd4b559d8), [`950f23443`](https://github.com/keystonejs/keystone-5/commit/950f23443ef8f1a176a3cf6b039f93a29d954f5e), [`3c3c67abb`](https://github.com/keystonejs/keystone-5/commit/3c3c67abb5ec82155fec893d389eac3bbeb12bbd)]:
  - @keystonejs/fields@13.0.0
  - @keystonejs/keystone@11.1.0
  - @keystonejs/app-admin-ui@7.0.3
  - @keystonejs/auth-password@5.1.10
  - @keystonejs/list-plugins@7.0.1

## 5.1.11

### Patch Changes

- Updated dependencies [[`8df24d2ab`](https://github.com/keystonejs/keystone-5/commit/8df24d2ab4bed8a7fc1a856c20a571781dd7c04e), [`083621c90`](https://github.com/keystonejs/keystone-5/commit/083621c9043a26af6fd48a57646e96b062c625a1), [`2a7f22062`](https://github.com/keystonejs/keystone-5/commit/2a7f220628bb0b4d58d0a4dca370e8922a25da80), [`37f57c39a`](https://github.com/keystonejs/keystone-5/commit/37f57c39ac490fa8a67499ac7ac75a8c04af41bf), [`33046a66f`](https://github.com/keystonejs/keystone-5/commit/33046a66f33a82cf099880303b44d9736344667d), [`7c38e2671`](https://github.com/keystonejs/keystone-5/commit/7c38e267143491f38699326f02764f40f337d416), [`835866e1a`](https://github.com/keystonejs/keystone-5/commit/835866e1a2954113d809c9f0bac186485ac6212b)]:
  - @keystonejs/keystone@11.0.0
  - @keystonejs/app-admin-ui@7.0.2
  - @keystonejs/adapter-mongoose@8.1.3

## 5.1.10

### Patch Changes

- Updated dependencies [[`4104e1f15`](https://github.com/keystonejs/keystone-5/commit/4104e1f15c545c05f680e8d16413862e875ca57a), [`c2ebb51c7`](https://github.com/keystonejs/keystone-5/commit/c2ebb51c786297879fe9fac2007804055631e9e2), [`c3faeeff4`](https://github.com/keystonejs/keystone-5/commit/c3faeeff41f9b29a9fc31ca4e7778b596fcb20b9), [`f493eecc3`](https://github.com/keystonejs/keystone-5/commit/f493eecc34a0f1a6ba9f8eea1c34882784c1b5fe), [`b61987552`](https://github.com/keystonejs/keystone-5/commit/b619875520aa3b10d104794140f7977ffaebfbf0), [`9738e2ec9`](https://github.com/keystonejs/keystone-5/commit/9738e2ec929a4aa7dc8a58a58c95587f149e44f8), [`397982096`](https://github.com/keystonejs/keystone-5/commit/39798209642571d3ba698e11410f5161cd1943bb), [`538378e4e`](https://github.com/keystonejs/keystone-5/commit/538378e4eb143dbe6e7a943408e0af302eb86b85), [`b5f89b305`](https://github.com/keystonejs/keystone-5/commit/b5f89b305eb8aaf63c3afc9f45f7aa7e4ce3f7b7), [`9f67e0e91`](https://github.com/keystonejs/keystone-5/commit/9f67e0e912b4f7dcb90fcb07c4b30bd6c45de464), [`ea9608342`](https://github.com/keystonejs/keystone-5/commit/ea960834262cec66f52fa39c1b3b07b702b3cd4d), [`8fddd97b2`](https://github.com/keystonejs/keystone-5/commit/8fddd97b20f1928ff7306d5d0dcc96e58ffe55fb), [`c1e6e6ff3`](https://github.com/keystonejs/keystone-5/commit/c1e6e6ff374fbac71535da0cc2badde0c13569e2), [`fdfb01417`](https://github.com/keystonejs/keystone-5/commit/fdfb01417b6d330342f4b6c326767c9567e35ca5), [`83548d43d`](https://github.com/keystonejs/keystone-5/commit/83548d43d661959a34a6de475994430ee1de3a1d), [`5ea313461`](https://github.com/keystonejs/keystone-5/commit/5ea313461aa2cba310b2634cc87780092c84b5be), [`cbfc67470`](https://github.com/keystonejs/keystone-5/commit/cbfc6747011329f7210e79ebe228f44ed8607321), [`aacc4a7f8`](https://github.com/keystonejs/keystone-5/commit/aacc4a7f8f88c242ae4bd784330d25056842d3fb), [`3204ae785`](https://github.com/keystonejs/keystone-5/commit/3204ae78576b0ab5649d5f5ae9cfbb1def347af1), [`da8ca8835`](https://github.com/keystonejs/keystone-5/commit/da8ca8835a910cc9b2f53e12ddaef88ffc194695), [`04c57fa78`](https://github.com/keystonejs/keystone-5/commit/04c57fa7840714d3413e093d468b78d740c95c9a), [`fd4e9100a`](https://github.com/keystonejs/keystone-5/commit/fd4e9100a636e0654db45d2471ce47a19b753647), [`f33388b50`](https://github.com/keystonejs/keystone-5/commit/f33388b5061d59747ab46e238f43e9b08f52bd1e), [`4b06157be`](https://github.com/keystonejs/keystone-5/commit/4b06157be6cffde2d88969823f7c410fefd82317), [`649017fbd`](https://github.com/keystonejs/keystone-5/commit/649017fbd5ea17c36e8c49d44836e1f2bcae2692), [`6ab523476`](https://github.com/keystonejs/keystone-5/commit/6ab523476ceca5ad57e7833ebd172b2da6c0b5fd), [`839666e25`](https://github.com/keystonejs/keystone-5/commit/839666e25d8bffefd034e6344e11d72dd43b925b), [`9ca0733e5`](https://github.com/keystonejs/keystone-5/commit/9ca0733e57b525a7efdfdedfb7c80364e186994e), [`7203c5889`](https://github.com/keystonejs/keystone-5/commit/7203c588901c46fae1550f3596cab43a1dd5052a), [`d2390b703`](https://github.com/keystonejs/keystone-5/commit/d2390b703d30e0b4264ab6ed9b1ba4d7bb9fca6c), [`34a9816d3`](https://github.com/keystonejs/keystone-5/commit/34a9816d3c40a35409be735e748cea2c6d5aa895), [`64c0d68ac`](https://github.com/keystonejs/keystone-5/commit/64c0d68acb1ee969097a8fe59b5c296473790c5c), [`60db743aa`](https://github.com/keystonejs/keystone-5/commit/60db743aa79f6590d6a3ebb0169021f1c36f64cc), [`326242533`](https://github.com/keystonejs/keystone-5/commit/3262425335de5eee6979e38ebb45f19a22c1ee1a), [`b15221ac2`](https://github.com/keystonejs/keystone-5/commit/b15221ac21746b1380ddb31395cdd386d52920a9), [`16649fa55`](https://github.com/keystonejs/keystone-5/commit/16649fa556ae3723ca97eb0752653259ccae4bc2), [`ba363d9a8`](https://github.com/keystonejs/keystone-5/commit/ba363d9a82d3ca3ec464547a5d9e38354bc2a172), [`170faf568`](https://github.com/keystonejs/keystone-5/commit/170faf568fef5b74147791476b466dc7a25c7d6f), [`927150d81`](https://github.com/keystonejs/keystone-5/commit/927150d81e297fdb5c8ccad087ea255b861dfe32), [`c7599a46f`](https://github.com/keystonejs/keystone-5/commit/c7599a46f05108b10b3a805a20b77b4d834e616d), [`b696b2acb`](https://github.com/keystonejs/keystone-5/commit/b696b2acbf7def8dba41f46ccef5ff852703b95a), [`d970580e1`](https://github.com/keystonejs/keystone-5/commit/d970580e14904ba2f2ac5e969257e71f77ab67d7), [`1cc3deaf0`](https://github.com/keystonejs/keystone-5/commit/1cc3deaf0b0a48aecb0f0f2454f4fe2634e1da5f), [`070519dbe`](https://github.com/keystonejs/keystone-5/commit/070519dbec289b759759343d084bc5d2de9d4b37), [`10babad4b`](https://github.com/keystonejs/keystone-5/commit/10babad4b4135738bc0633b113e5c96d3ddb9e9f), [`24f5ab51c`](https://github.com/keystonejs/keystone-5/commit/24f5ab51c69d744fb0e1f47a0723c2cc70492010), [`de27d2c16`](https://github.com/keystonejs/keystone-5/commit/de27d2c16b520ae5126a74efb85c70ae88ae6b60), [`c35f9cd1c`](https://github.com/keystonejs/keystone-5/commit/c35f9cd1cba5bf27eb9cf7cc1a113716bc4a50ef), [`79433ef17`](https://github.com/keystonejs/keystone-5/commit/79433ef17f8e7d51a1a1dbfd633574fbd8eef887)]:
  - @keystonejs/keystone@10.0.0
  - @keystonejs/app-admin-ui@7.0.0
  - @keystonejs/fields@12.0.0
  - @keystonejs/list-plugins@7.0.0
  - @keystonejs/auth-password@5.1.9
  - @keystonejs/app-graphql@5.1.8
  - @keystonejs/adapter-mongoose@8.1.2

## 5.1.9

### Patch Changes

- Updated dependencies [[`2b0f6441`](https://github.com/keystonejs/keystone-5/commit/2b0f6441e50787a4a82f417b573078717b39e9be), [`a124417f`](https://github.com/keystonejs/keystone-5/commit/a124417fddc75889db5e4e8e0d5625fb4af12590), [`54931d75`](https://github.com/keystonejs/keystone-5/commit/54931d75d3f26f4f300c2c4c3ee65ed3183b4a6a), [`f9604621`](https://github.com/keystonejs/keystone-5/commit/f9604621048afceb071a43c7b8d36d944555487f), [`3e5a8962`](https://github.com/keystonejs/keystone-5/commit/3e5a8962cc982765574464537904008be975b446), [`5a58bde6`](https://github.com/keystonejs/keystone-5/commit/5a58bde636f551f2d241086d47781d3c88852b99), [`e9a0de2c`](https://github.com/keystonejs/keystone-5/commit/e9a0de2cc03c211beca01ec206244105bdca6afc), [`3b0f4137`](https://github.com/keystonejs/keystone-5/commit/3b0f4137df4112c79e6db57ae68fe04ad338da4c), [`15c57317`](https://github.com/keystonejs/keystone-5/commit/15c573178fa056912503f3ed83efeccceabba3ec), [`d60e2ca9`](https://github.com/keystonejs/keystone-5/commit/d60e2ca91ab4a7dd815e030bcc92991c3380fa7e), [`94d55b8f`](https://github.com/keystonejs/keystone-5/commit/94d55b8fc3a334a556c19765063e9efb594b41a7), [`59ed6310`](https://github.com/keystonejs/keystone-5/commit/59ed6310bacc76f571639de048689becbedbeac5), [`2709a6b5`](https://github.com/keystonejs/keystone-5/commit/2709a6b512fe636d979837599b67bdb17b2517b1)]:
  - @keystonejs/app-admin-ui@6.0.1
  - @keystonejs/fields@11.0.0
  - @keystonejs/list-plugins@6.0.0
  - @keystonejs/auth-password@5.1.8
  - @keystonejs/keystone@9.0.1

## 5.1.8

### Patch Changes

- [`3e9bfb85`](https://github.com/keystonejs/keystone-5/commit/3e9bfb854196dffcca98f60c5de9ad463d79f4f2) [#2911](https://github.com/keystonejs/keystone-5/pull/2911) Thanks [@Vultraz](https://github.com/Vultraz)! - Revamped Sign In page design to better match Sign Out page.

* [`9e2e0071`](https://github.com/keystonejs/keystone-5/commit/9e2e00715aff50f2ddfedf3dbc14f390275ff23b) [#2853](https://github.com/keystonejs/keystone-5/pull/2853) Thanks [@timleslie](https://github.com/timleslie)! - Upgraded dev dependencies.

- [`0fbc5b98`](https://github.com/keystonejs/keystone-5/commit/0fbc5b989a9f96248d1bd7f2f589fe77cb1d8f7d) [#2882](https://github.com/keystonejs/keystone-5/pull/2882) Thanks [@Vultraz](https://github.com/Vultraz)! - The `cookieSecret` option no longer defaults to a static value. It is now required in production mode. In development mode, if undefined, a random new value is generated each time the server is started.

- Updated dependencies [[`c3270e50`](https://github.com/keystonejs/keystone-5/commit/c3270e50a11ee328a31c4a8d8e77ee7ef873881c), [`4d3efe0f`](https://github.com/keystonejs/keystone-5/commit/4d3efe0fb65e0155c130cf3e0c378f024965f46d), [`c506dfa8`](https://github.com/keystonejs/keystone-5/commit/c506dfa81a5ef3640716f69412b1a37c947d4f95), [`72e0a4e1`](https://github.com/keystonejs/keystone-5/commit/72e0a4e19942df11c72d11c2cf6ee9bc94300d87), [`5e20df81`](https://github.com/keystonejs/keystone-5/commit/5e20df81aaa8b464071c1e0adc64635752163362), [`a1c9c372`](https://github.com/keystonejs/keystone-5/commit/a1c9c372c274de8cb0d0012c0d5c20c46f356b0a), [`04dffb3c`](https://github.com/keystonejs/keystone-5/commit/04dffb3c0abd03712df431ff57b3271b10f4f47b), [`bfa3a287`](https://github.com/keystonejs/keystone-5/commit/bfa3a287a40f625b74d1f430dff6826296bb7019), [`12126788`](https://github.com/keystonejs/keystone-5/commit/121267885eb3e279eb5b6d035568f547323dd245), [`d639624d`](https://github.com/keystonejs/keystone-5/commit/d639624db8615b52731af56fea0ae9c573ef38a1), [`e0e3e30a`](https://github.com/keystonejs/keystone-5/commit/e0e3e30a9051741de3f5a0c12ba00f2238d54800), [`3e9bfb85`](https://github.com/keystonejs/keystone-5/commit/3e9bfb854196dffcca98f60c5de9ad463d79f4f2), [`5ec4e5d5`](https://github.com/keystonejs/keystone-5/commit/5ec4e5d547503baeae2ac2f6317b66c2ebae93b7), [`6e507838`](https://github.com/keystonejs/keystone-5/commit/6e5078380e1d17eb2884554eef114fdd521a15f4), [`c8e52f3b`](https://github.com/keystonejs/keystone-5/commit/c8e52f3ba892269922c1ed3af0c2114f07387704), [`3cd5f205`](https://github.com/keystonejs/keystone-5/commit/3cd5f205348311a2ad00875782530b96c3c477af), [`08087998`](https://github.com/keystonejs/keystone-5/commit/08087998af0045aa45b26d721f75639cd279ae1b), [`6c19f04c`](https://github.com/keystonejs/keystone-5/commit/6c19f04c0e5ce972283562daebe60c9f4a29c55c), [`fcb9f2c1`](https://github.com/keystonejs/keystone-5/commit/fcb9f2c1751ec866adddeb6946e8ab60ffef06e6), [`547fd837`](https://github.com/keystonejs/keystone-5/commit/547fd8373797f0cb5d8dd0acd193750686053fac), [`2a1e4f49`](https://github.com/keystonejs/keystone-5/commit/2a1e4f49d7f234c49e5b04440ff786ddf3e9e7ed), [`9e2e0071`](https://github.com/keystonejs/keystone-5/commit/9e2e00715aff50f2ddfedf3dbc14f390275ff23b), [`b5c44934`](https://github.com/keystonejs/keystone-5/commit/b5c4493442c5e4cfeba23c058a9a6819c628aab9), [`0fbc5b98`](https://github.com/keystonejs/keystone-5/commit/0fbc5b989a9f96248d1bd7f2f589fe77cb1d8f7d), [`e3d46ce4`](https://github.com/keystonejs/keystone-5/commit/e3d46ce4bd9f9ec8808ab3194672c6849e624e27), [`d8584765`](https://github.com/keystonejs/keystone-5/commit/d85847652e224e5000e036be2df0b8a45ab96385), [`405d0ae1`](https://github.com/keystonejs/keystone-5/commit/405d0ae1d332e31423db43f58ac26c25abbe94a3), [`121cb02d`](https://github.com/keystonejs/keystone-5/commit/121cb02d1c9886a24bfa14c985ede48d6a56edca), [`da1359df`](https://github.com/keystonejs/keystone-5/commit/da1359dfc1bff7e27505eff876efe3a0865bae2d), [`285026a0`](https://github.com/keystonejs/keystone-5/commit/285026a04ffce23ab72d7defc18ced2e980b0de4), [`d4811b02`](https://github.com/keystonejs/keystone-5/commit/d4811b0231c5d64e95dbbce57531df0931d4defa), [`e2800875`](https://github.com/keystonejs/keystone-5/commit/e28008756cbcc1e07e012a9fdb0cfa0ad94f3673), [`60e2c7eb`](https://github.com/keystonejs/keystone-5/commit/60e2c7eb2298a016c68a19a056040a3b45beab2a), [`99da34a8`](https://github.com/keystonejs/keystone-5/commit/99da34a8db26b8861b08cee330407605e787a80c), [`9bad0e5f`](https://github.com/keystonejs/keystone-5/commit/9bad0e5fe67d2379537f4cb145058c6c809b3533), [`9a94cee8`](https://github.com/keystonejs/keystone-5/commit/9a94cee8e59fdf7956d82887390dfb84bf6185fa), [`bcf03a7f`](https://github.com/keystonejs/keystone-5/commit/bcf03a7f8067a3f29f22dde397b957bf5cee1a07), [`e765ad20`](https://github.com/keystonejs/keystone-5/commit/e765ad20abae9838f64b72b7d43767ec87db336a), [`1ca8951c`](https://github.com/keystonejs/keystone-5/commit/1ca8951c71c5af3b0ff338a9a6a8733231fb90c4), [`d7eb2601`](https://github.com/keystonejs/keystone-5/commit/d7eb260144d2aa31e7ef4e636e7a23f91dc37285)]:
  - @keystonejs/list-plugins@5.2.1
  - @keystonejs/app-admin-ui@6.0.0
  - @keystonejs/fields@10.0.0
  - @keystonejs/keystone@9.0.0
  - @keystonejs/auth-password@5.1.7
  - @keystonejs/session@7.0.0
  - @keystonejs/adapter-mongoose@8.1.0
  - @keystonejs/app-graphql@5.1.7

## 5.1.7

### Patch Changes

- [`5014b2c4`](https://github.com/keystonejs/keystone-5/commit/5014b2c48b4343f44d57c90a9aadd40ce8207527) [#2674](https://github.com/keystonejs/keystone-5/pull/2674) Thanks [@individual-it](https://github.com/individual-it)! - update cypress to 4.3.0

- Updated dependencies [[`c013d8bc`](https://github.com/keystonejs/keystone-5/commit/c013d8bc1113b2a31ededc3918ab98c2c99f25f4), [`3193f4a5`](https://github.com/keystonejs/keystone-5/commit/3193f4a56c6391d07e8c04913a667940ef7b8815), [`885bc678`](https://github.com/keystonejs/keystone-5/commit/885bc6786dd63cad86515b2fe6a39ea52b39d4c0), [`93ae77ef`](https://github.com/keystonejs/keystone-5/commit/93ae77efe71151279a15ddb7ddc3df60651022b4), [`eb90aea6`](https://github.com/keystonejs/keystone-5/commit/eb90aea6b33dda8d95baba818306328dd747247f)]:
  - @keystonejs/fields@9.0.1
  - @keystonejs/app-admin-ui@5.9.6
  - @keystonejs/auth-password@5.1.6

## 5.1.6

### Patch Changes

- Updated dependencies [[`fd685241`](https://github.com/keystonejs/keystone-5/commit/fd68524135025e4d800b4a98932916736dd50e9d)]:
  - @keystonejs/adapter-mongoose@8.0.0
  - @keystonejs/fields@9.0.0
  - @keystonejs/keystone@8.0.0
  - @keystonejs/app-admin-ui@5.9.5
  - @keystonejs/auth-password@5.1.5
  - @keystonejs/list-plugins@5.1.4

## 5.1.5

### Patch Changes

- Updated dependencies [[`e7e4bc1d`](https://github.com/keystonejs/keystone-5/commit/e7e4bc1d22149d4daceb31d303f6ad10c2b853ba), [`58c4ffc3`](https://github.com/keystonejs/keystone-5/commit/58c4ffc3d4b1edf8bdfbc4ea299133d303239fc6), [`b4d16b89`](https://github.com/keystonejs/keystone-5/commit/b4d16b89aab643f34d70f42823817a246bf16373), [`7fc00071`](https://github.com/keystonejs/keystone-5/commit/7fc00071cd22514103593f0da68b9efa3bf853e9), [`63169b6a`](https://github.com/keystonejs/keystone-5/commit/63169b6a6b6a4dc286cd224b7f871960f2d4b0ad), [`007063c4`](https://github.com/keystonejs/keystone-5/commit/007063c4f17e6e7038312ed9126eaf91757e7939), [`4a7d1eab`](https://github.com/keystonejs/keystone-5/commit/4a7d1eabf9b44fac7e16dfe20afdce409986e8dc), [`c08c28d2`](https://github.com/keystonejs/keystone-5/commit/c08c28d22f2c6a2bfa73ab0ea347c9e0da8a9063), [`d138736d`](https://github.com/keystonejs/keystone-5/commit/d138736db184c5884171c7a65e43377f248046b5), [`2ae2bd47`](https://github.com/keystonejs/keystone-5/commit/2ae2bd47eb54a816cfd4c8cd178c460729cbc258), [`2cbd38b0`](https://github.com/keystonejs/keystone-5/commit/2cbd38b05adc98cface11a8767f66b48a1cb0bbf), [`3407fa68`](https://github.com/keystonejs/keystone-5/commit/3407fa68b91d7ebb3e7288c7e95631013fe12535), [`c2b1b725`](https://github.com/keystonejs/keystone-5/commit/c2b1b725a9474348964a4ac2e0f5b4aaf1a7f486)]:
  - @keystonejs/fields@8.0.0
  - @keystonejs/app-admin-ui@5.9.4
  - @keystonejs/keystone@7.1.0
  - @keystonejs/adapter-mongoose@7.0.0
  - @keystonejs/app-graphql@5.1.5
  - @keystonejs/app-static@5.1.2
  - @keystonejs/auth-password@5.1.4
  - @keystonejs/list-plugins@5.1.3
  - @keystonejs/session@6.0.1

## 5.1.4

### Patch Changes

- Updated dependencies [[`b6a555c2`](https://github.com/keystonejs/keystone-5/commit/b6a555c28296394908757f7404b72bc6b828b52a), [`b6a555c2`](https://github.com/keystonejs/keystone-5/commit/b6a555c28296394908757f7404b72bc6b828b52a), [`7c9d36a2`](https://github.com/keystonejs/keystone-5/commit/7c9d36a2d5002258964cbd9414766ee244945005), [`ca28681c`](https://github.com/keystonejs/keystone-5/commit/ca28681ca23c74bc57041fa36c20b93a4520e762), [`68be8f45`](https://github.com/keystonejs/keystone-5/commit/68be8f452909100fbddec431d6fe60c20a06a700), [`61a70503`](https://github.com/keystonejs/keystone-5/commit/61a70503f6c184a8f0f5440466399f12e6d7fa41), [`cec7ba5e`](https://github.com/keystonejs/keystone-5/commit/cec7ba5e2061280eff2a1d989054ecb02760e36d)]:
  - @keystonejs/app-admin-ui@5.9.3
  - @keystonejs/keystone@7.0.0
  - @keystonejs/session@6.0.0
  - @keystonejs/app-graphql@5.1.4
  - @keystonejs/adapter-mongoose@6.0.0
  - @keystonejs/fields@7.0.2
  - @keystonejs/auth-password@5.1.3

## 5.1.3

### Patch Changes

- Updated dependencies [[`161bf3e5`](https://github.com/keystonejs/keystone-5/commit/161bf3e57acb1b3d88a0836507d4c8dd4935f260)]:
  - @keystonejs/fields@7.0.0
  - @keystonejs/app-admin-ui@5.9.2
  - @keystonejs/auth-password@5.1.2
  - @keystonejs/keystone@6.0.1
  - @keystonejs/list-plugins@5.1.2

## 5.1.2

### Patch Changes

- [`5ba330b8`](https://github.com/keystonejs/keystone-5/commit/5ba330b8b2609ea0033a636daf9a215a5a192c20) [#2487](https://github.com/keystonejs/keystone-5/pull/2487) Thanks [@Noviny](https://github.com/Noviny)! - Small changes to package.json (mostly adding a repository field)

- Updated dependencies [[`10e88dc3`](https://github.com/keystonejs/keystone-5/commit/10e88dc3d81f5e021db0bfb31f7547852c602c14), [`5dea5561`](https://github.com/keystonejs/keystone-5/commit/5dea5561527a4e991d017d087f512101d53256b9), [`e46f0adf`](https://github.com/keystonejs/keystone-5/commit/e46f0adf97141e1f1205787453173a0585df5bc3), [`d7c7d827`](https://github.com/keystonejs/keystone-5/commit/d7c7d8271c5da8fec01df123c954d6a03aa41146), [`6975f169`](https://github.com/keystonejs/keystone-5/commit/6975f16959bde3fe0e861977471c94a8c9f2c0b0), [`f0148ccb`](https://github.com/keystonejs/keystone-5/commit/f0148ccb03abb882195b9bd44c34b780170c89ef), [`42497b8e`](https://github.com/keystonejs/keystone-5/commit/42497b8ebbaeaf0f4d7881dbb76c6abafde4cace), [`fe42a997`](https://github.com/keystonejs/keystone-5/commit/fe42a997c81825a819ac28f05e02d1ed61099542), [`6790d053`](https://github.com/keystonejs/keystone-5/commit/6790d053effba118d0b3a51806a5c066cf022d45), [`97fb01fe`](https://github.com/keystonejs/keystone-5/commit/97fb01fe5a32f5003a084c1fd357852fc28f74e4), [`6111e065`](https://github.com/keystonejs/keystone-5/commit/6111e06554a6aa6db0f7df1a6c16f9da8e81fce4), [`2d1069f1`](https://github.com/keystonejs/keystone-5/commit/2d1069f11f5f8941b0a18e482541043c853ebb4f), [`6de20ce6`](https://github.com/keystonejs/keystone-5/commit/6de20ce6b4aad46d2a8cc5ca8d1ada179aca7c9b), [`949f2f6a`](https://github.com/keystonejs/keystone-5/commit/949f2f6a3889492015281ffba45a8b3d37e6d888), [`6b353eff`](https://github.com/keystonejs/keystone-5/commit/6b353effc8b617137a3978b2c845e01403889722), [`df422e70`](https://github.com/keystonejs/keystone-5/commit/df422e70291ebf8660428c9a4a378611623985ae), [`5ba330b8`](https://github.com/keystonejs/keystone-5/commit/5ba330b8b2609ea0033a636daf9a215a5a192c20)]:
  - @keystonejs/keystone@6.0.0
  - @keystonejs/app-graphql@5.1.2
  - @keystonejs/app-admin-ui@5.9.1
  - @keystonejs/fields@6.3.2
  - @keystonejs/adapter-mongoose@5.2.1
  - @keystonejs/app-static@5.1.1
  - @keystonejs/auth-password@5.1.1
  - @keystonejs/list-plugins@5.1.1
  - @keystonejs/session@5.1.1

## 5.1.1

### Patch Changes

- [`535ea6a9`](https://github.com/keystonejs/keystone-5/commit/535ea6a93d74eced46a8e5711a2e6aafa0dca95b) [#2390](https://github.com/keystonejs/keystone-5/pull/2390) Thanks [@Vultraz](https://github.com/Vultraz)! - Update `cross-env` dependency to 7.0.0.

- Updated dependencies [[`0c9d3125`](https://github.com/keystonejs/keystone-5/commit/0c9d3125d9b4bb37047a6c6ed61796e52fba8b17), [`7ce804a8`](https://github.com/keystonejs/keystone-5/commit/7ce804a877300709375e5bc14206080ab15aec54), [`d8a7b8a2`](https://github.com/keystonejs/keystone-5/commit/d8a7b8a23b4c3e1545d101a92323be165ad362e2), [`5c6ee24c`](https://github.com/keystonejs/keystone-5/commit/5c6ee24ceea951d7add79af55ef5a408edd8b763), [`9a388f01`](https://github.com/keystonejs/keystone-5/commit/9a388f01e388272d56f81af2247d8030e0f2c972), [`6b1ea0ec`](https://github.com/keystonejs/keystone-5/commit/6b1ea0ec1b536b5c9098105f5e77c0cd5feaf6b0), [`7c552a14`](https://github.com/keystonejs/keystone-5/commit/7c552a14078843710b7f225a88d1cd2024514981), [`b30d1361`](https://github.com/keystonejs/keystone-5/commit/b30d13612c54c0a3f0ebc2fc9c777954d4c4727f), [`bd4096ee`](https://github.com/keystonejs/keystone-5/commit/bd4096ee86f7790c76db23090b38f880e5aa7ecc), [`fd94849b`](https://github.com/keystonejs/keystone-5/commit/fd94849bccaf13426d2f7bcc2cd82fe81da7be7e), [`5e8c6df3`](https://github.com/keystonejs/keystone-5/commit/5e8c6df3e7c8bee4c76ca4d5be38cd6aff198bd8), [`1b3ee45e`](https://github.com/keystonejs/keystone-5/commit/1b3ee45e9ec6e52329b208c73e5a3597aea69799), [`dcdd8ed9`](https://github.com/keystonejs/keystone-5/commit/dcdd8ed9142cf3328a7af80bc167ef93c7669b09), [`3abc5883`](https://github.com/keystonejs/keystone-5/commit/3abc58831e0f9b5871569a3fa6b21be7dc269cf3), [`8bdbb114`](https://github.com/keystonejs/keystone-5/commit/8bdbb114f6b2864693ae6e534df6fe8ee8345a60), [`4313b645`](https://github.com/keystonejs/keystone-5/commit/4313b64554b1cc64e64245706b00c0510a5dd0b4), [`362efbc2`](https://github.com/keystonejs/keystone-5/commit/362efbc2e054fa48aedb515c54b5a64757832be9), [`c059b63c`](https://github.com/keystonejs/keystone-5/commit/c059b63c6ebdbb60ac4095d1efd791d598b2756c)]:
  - @keystonejs/app-admin-ui@5.9.0
  - @keystonejs/keystone@5.6.0
  - @keystonejs/fields@6.3.1
  - @keystonejs/app-graphql@5.1.1

## 5.1.0

### Minor Changes

- [`517b23e4`](https://github.com/keystonejs/keystone-5/commit/517b23e4b17414ed1807e8d7af1e67377ba3b7bf) [#2391](https://github.com/keystonejs/keystone-5/pull/2391) Thanks [@timleslie](https://github.com/timleslie)! - Removed support for Node 8.x, as it is [no longer in maintenance mode](https://nodejs.org/en/about/releases/).

### Patch Changes

- Updated dependencies [[`517b23e4`](https://github.com/keystonejs/keystone-5/commit/517b23e4b17414ed1807e8d7af1e67377ba3b7bf)]:
  - @keystonejs/adapter-mongoose@5.2.0
  - @keystonejs/app-admin-ui@5.8.0
  - @keystonejs/app-graphql@5.1.0
  - @keystonejs/app-static@5.1.0
  - @keystonejs/auth-password@5.1.0
  - @keystonejs/fields@6.3.0
  - @keystonejs/keystone@5.5.0
  - @keystonejs/list-plugins@5.1.0
  - @keystonejs/session@5.1.0

## 5.0.3

### Patch Changes

- Updated dependencies [[`77056ebd`](https://github.com/keystonejs/keystone-5/commit/77056ebdb31e58d27372925e8e24311a8c7d9e33), [`267dab2f`](https://github.com/keystonejs/keystone-5/commit/267dab2fee5bbea711c417c13366862e8e0ab3be), [`8188d76c`](https://github.com/keystonejs/keystone-5/commit/8188d76cb3f5d3e112ef95fd4e1887db9a520d9d), [`5b81152d`](https://github.com/keystonejs/keystone-5/commit/5b81152d72b16bcfa2ef16620721b059cb225d05), [`af1e9e4d`](https://github.com/keystonejs/keystone-5/commit/af1e9e4d3b74753b903b20641b51df99184793df), [`733ac847`](https://github.com/keystonejs/keystone-5/commit/733ac847cab488dc92a30e7b458191d750fd5a3d), [`e68fc43b`](https://github.com/keystonejs/keystone-5/commit/e68fc43ba006f9c958f9c81ae20b230d05c2cab6), [`d4d89836`](https://github.com/keystonejs/keystone-5/commit/d4d89836700413c1da2b76e9b82b649c2cac859d), [`946a52fd`](https://github.com/keystonejs/keystone-5/commit/946a52fd7057bb73f4ffd465ef51498172926866), [`5540771e`](https://github.com/keystonejs/keystone-5/commit/5540771e52b5cb1aa33c0486dede7f2f9bc0944f), [`640cbd95`](https://github.com/keystonejs/keystone-5/commit/640cbd9556cb8848fdfbe9689ac4aadd1be29fba), [`1f4dc33d`](https://github.com/keystonejs/keystone-5/commit/1f4dc33d8a5ac4e38427eb215a7a8bc3504ae153), [`ee6fbcb2`](https://github.com/keystonejs/keystone-5/commit/ee6fbcb264a640f58332c50a2f502a4380c0d071), [`0145f7e2`](https://github.com/keystonejs/keystone-5/commit/0145f7e21d9297e3037c709587eb3b4220ba3f01), [`1ad222ed`](https://github.com/keystonejs/keystone-5/commit/1ad222ed27b2f261f8fda8eb819027553ecd0cd2), [`2cc83b12`](https://github.com/keystonejs/keystone-5/commit/2cc83b12be757019ba25658139478e8f5b2b19c6), [`fb0c8331`](https://github.com/keystonejs/keystone-5/commit/fb0c83316c1f3e6796a24480d3cfc8055355a7fc), [`945ff089`](https://github.com/keystonejs/keystone-5/commit/945ff089a60e5a1e1a8cdceb8df1b04f8d6263f4), [`a1dcbd7b`](https://github.com/keystonejs/keystone-5/commit/a1dcbd7bd7448fdcacbfe9fb0196bfee3c4a5326), [`6a348b93`](https://github.com/keystonejs/keystone-5/commit/6a348b93607c305c4ba61c1406a4acd508f33f64)]:
  - @keystonejs/keystone@5.3.0
  - @keystonejs/fields@6.0.0
  - @keystonejs/app-admin-ui@5.3.0
  - @keystonejs/adapter-mongoose@5.1.3
  - @keystonejs/app-graphql@5.0.1
  - @keystonejs/auth-password@5.0.1
  - @keystonejs/list-plugins@5.0.1

## 5.0.2

### Patch Changes

- [`8735393e`](https://github.com/keystonejs/keystone-5/commit/8735393ec7b01dd0491700244e915b4b47c1cc53) [#1849](https://github.com/keystonejs/keystone-5/pull/1849) Thanks [@timleslie](https://github.com/timleslie)! - Updated the packages devDependencies.
- Updated dependencies [[`45fd7ab8`](https://github.com/keystonejs/keystone-5/commit/45fd7ab899655364d0071c0d276d188378944ff5), [`8226eb47`](https://github.com/keystonejs/keystone-5/commit/8226eb4709ea8ad5773c900eaaa96068d3cb6bad), [`8226eb47`](https://github.com/keystonejs/keystone-5/commit/8226eb4709ea8ad5773c900eaaa96068d3cb6bad), [`b0756c65`](https://github.com/keystonejs/keystone-5/commit/b0756c65525625919c72364d8cefc32d864c7c0e), [`20632bca`](https://github.com/keystonejs/keystone-5/commit/20632bca495058f2845d36fe95650eede0a9ebdc), [`3138013c`](https://github.com/keystonejs/keystone-5/commit/3138013c49205bd7f9b05833ae6158ebeb281dc0), [`d132a3c6`](https://github.com/keystonejs/keystone-5/commit/d132a3c64aec707b98ed9a9ceffee44a98749b0a), [`ba8aef71`](https://github.com/keystonejs/keystone-5/commit/ba8aef71d1a04f643fb7f7590d7d6d136b1d4eba), [`5595e4c4`](https://github.com/keystonejs/keystone-5/commit/5595e4c45c618fa7e13a3d91e3ea3892b4f10475), [`b17b50c0`](https://github.com/keystonejs/keystone-5/commit/b17b50c0783dd246786aad1de41136967ad73b5c), [`479597e0`](https://github.com/keystonejs/keystone-5/commit/479597e0920cbedf28f76c14a95b564282f2c1d9)]:
  - @keystonejs/keystone@5.1.1
  - @keystonejs/app-admin-ui@5.0.2
  - @keystonejs/fields@5.1.0
  - @keystonejs/adapter-mongoose@5.1.1

## 5.0.1

### Patch Changes

- [`ce6e98f2`](https://github.com/keystonejs/keystone-5/commit/ce6e98f2cf63f5c27a7433e932e8bfbd00376874) [#1836](https://github.com/keystonejs/keystone-5/pull/1836) Thanks [@timleslie](https://github.com/timleslie)! - Deployed cypress-file-upload instead of a custom implementation

- Updated dependencies [[`209b7078`](https://github.com/keystonejs/keystone-5/commit/209b7078c7fa4f4d87568c58cb6cb6ad8162fe46), [`19b08a30`](https://github.com/keystonejs/keystone-5/commit/19b08a30b3dbfb7c7a0056f210769bbf6e171c85), [`3c19cddd`](https://github.com/keystonejs/keystone-5/commit/3c19cddd0b8b8d1e17385a01a813a9e84ec14bb5)]:
  - @keystonejs/fields@5.0.1
  - @keystonejs/app-admin-ui@5.0.1
  - @keystonejs/adapter-mongoose@5.0.1

## 5.0.0

### Major Changes

- [`7b4ed362`](https://github.com/keystonejs/keystone-5/commit/7b4ed3623f5774d7783c39962bfa1ce97938e310) [#1821](https://github.com/keystonejs/keystone-5/pull/1821) Thanks [@jesstelford](https://github.com/jesstelford)! - Release @keystonejs/\* packages (つ＾ ◡ ＾)つ

  - This is the first release of `@keystonejs/*` packages (previously `@keystone-alpha/*`).
  - All packages in the `@keystone-alpha` namespace are now available in the `@keystonejs` namespace, starting at version `5.0.0`.
  - To upgrade your project you must update any `@keystone-alpha/*` dependencies in `package.json` to point to `"@keystonejs/*": "^5.0.0"` and update any `require`/`import` statements in your code.

### Patch Changes

- Updated dependencies [[`7b4ed362`](https://github.com/keystonejs/keystone-5/commit/7b4ed3623f5774d7783c39962bfa1ce97938e310)]:
  - @keystonejs/adapter-mongoose@5.0.0
  - @keystonejs/app-admin-ui@5.0.0
  - @keystonejs/app-graphql@5.0.0
  - @keystonejs/app-static@5.0.0
  - @keystonejs/auth-password@5.0.0
  - @keystonejs/fields@5.0.0
  - @keystonejs/keystone@5.0.0
  - @keystonejs/list-plugins@5.0.0
  - @keystonejs/session@5.0.0

# @keystone-alpha/cypress-project-login

## 1.5.6

### Patch Changes

- Updated dependencies [[`0a36b0f4`](https://github.com/keystonejs/keystone-5/commit/0a36b0f403da73a76106b5e14940a789466b4f94), [`7129c887`](https://github.com/keystonejs/keystone-5/commit/7129c8878a825d961f2772be497dcd5bd6b2b697), [`3bc02545`](https://github.com/keystonejs/keystone-5/commit/3bc025452fb8e6e69790bdbee032ddfdeeb7dabb), [`768420f5`](https://github.com/keystonejs/keystone-5/commit/768420f567c244d57a4e2a3aaafe628ea9813d9d), [`a48281ba`](https://github.com/keystonejs/keystone-5/commit/a48281ba605bf5bebc89fcbb36d3e69c17182eec), [`a8ee0179`](https://github.com/keystonejs/keystone-5/commit/a8ee0179842f790dd3b5d4aae3524793e752ee26), [`effc1f63`](https://github.com/keystonejs/keystone-5/commit/effc1f639d5824720b7a9d82c2ee881d77acb901)]:
  - @keystone-alpha/keystone@16.1.0
  - @keystone-alpha/app-graphql@8.2.1
  - @keystone-alpha/adapter-mongoose@6.0.1
  - @keystone-alpha/app-admin-ui@5.10.3
  - @keystone-alpha/fields@15.0.0
  - @keystone-alpha/auth-password@1.0.6
  - @keystone-alpha/list-plugins@1.0.5

## 1.5.5

### Patch Changes

- Updated dependencies [[`6d7d0df0`](https://github.com/keystonejs/keystone-5/commit/6d7d0df0515c3aa21c7d24db17919ddbb5701ce9)]:
  - @keystone-alpha/adapter-mongoose@6.0.0
  - @keystone-alpha/fields@14.0.0
  - @keystone-alpha/keystone@16.0.0
  - @keystone-alpha/app-admin-ui@5.10.2
  - @keystone-alpha/auth-password@1.0.5
  - @keystone-alpha/list-plugins@1.0.4

## 1.5.4

- Updated dependencies [4e6a574d](https://github.com/keystonejs/keystone-5/commit/4e6a574d):
- Updated dependencies [b96a3a58](https://github.com/keystonejs/keystone-5/commit/b96a3a58):
  - @keystone-alpha/app-admin-ui@5.10.0
  - @keystone-alpha/auth-password@1.0.4
  - @keystone-alpha/keystone@15.3.1
  - @keystone-alpha/list-plugins@1.0.3
  - @keystone-alpha/fields@13.0.0
  - @keystone-alpha/adapter-mongoose@5.0.0

## 1.5.3

- Updated dependencies [42a45bbd](https://github.com/keystonejs/keystone-5/commit/42a45bbd):
  - @keystone-alpha/adapter-mongoose@4.0.7
  - @keystone-alpha/keystone@15.1.0

## 1.5.2

### Patch Changes

- [b73dd350](https://github.com/keystonejs/keystone-5/commit/b73dd350): Fix flakey integration tests

- Updated dependencies [b61289b4](https://github.com/keystonejs/keystone-5/commit/b61289b4):
- Updated dependencies [0bba9f07](https://github.com/keystonejs/keystone-5/commit/0bba9f07):
- Updated dependencies [9ade2b2d](https://github.com/keystonejs/keystone-5/commit/9ade2b2d):
  - @keystone-alpha/adapter-mongoose@4.0.6
  - @keystone-alpha/keystone@15.0.0
  - @keystone-alpha/app-admin-ui@5.8.1
  - @keystone-alpha/auth-password@1.0.2
  - @keystone-alpha/list-plugins@1.0.2
  - @keystone-alpha/fields@12.0.0

## 1.5.1

- Updated dependencies [decf7319](https://github.com/keystonejs/keystone-5/commit/decf7319):
- Updated dependencies [89c0d7e9](https://github.com/keystonejs/keystone-5/commit/89c0d7e9):
- Updated dependencies [89c0d7e9](https://github.com/keystonejs/keystone-5/commit/89c0d7e9):
- Updated dependencies [f8ad0975](https://github.com/keystonejs/keystone-5/commit/f8ad0975):
- Updated dependencies [a8e9378d](https://github.com/keystonejs/keystone-5/commit/a8e9378d):
  - @keystone-alpha/adapter-mongoose@4.0.5
  - @keystone-alpha/keystone@14.0.0
  - @keystone-alpha/app-admin-ui@5.8.0
  - @keystone-alpha/auth-password@1.0.1
  - @keystone-alpha/list-plugins@1.0.1
  - @keystone-alpha/fields@11.0.0
  - @keystone-alpha/app-graphql@8.0.0

## 1.5.0

### Minor Changes

- [2350a9fd](https://github.com/keystonejs/keystone-5/commit/2350a9fd): Admin UI has a new config option: `isAccessAllowed({ authentication: { user, listKey } }) => Boolean` to restrict who can login to the Admin UI.

## 1.4.1

- Updated dependencies [8d0d98c7](https://github.com/keystonejs/keystone-5/commit/8d0d98c7):
  - @keystone-alpha/adapter-mongoose@4.0.4
  - @keystone-alpha/app-graphql@7.0.0
  - @keystone-alpha/keystone@13.0.0

## 1.4.0

### Minor Changes

- [3469873b](https://github.com/keystonejs/keystone-5/commit/3469873b): added initial release of list-plugins with support for createdAt, updatedAt, createdBy and updatedBy tracking using List plugins feature
  updated login test project to add a list with all possible tracking field options.

## 1.3.1

- Updated dependencies [33001656](https://github.com/keystonejs/keystone-5/commit/33001656):
  - @keystone-alpha/adapter-mongoose@4.0.3
  - @keystone-alpha/keystone@12.0.0

## 1.3.0

### Minor Changes

- [e42fdb4a](https://github.com/keystonejs/keystone-5/commit/e42fdb4a): Makes the password auth strategy its own package.
  Previously: `const { Keystone, PasswordAuthStrategy } = require('@keystone-alpha/keystone');`
  After change: `const { PasswordAuthStrategy } = require('@keystone-alpha/auth-password');`

## 1.2.0

### Minor Changes

- [b86f0e26](https://github.com/keystonejs/keystone-5/commit/b86f0e26): Renames the package `@keystone-alpha/passport-auth` to `@keystone-alpha/auth-passport`. Anyone using `passport-auth` should switch over to the new package - the old one will no longer be receiving updates.

## 1.1.7

### Patch Changes

- [992c7e74](https://github.com/keystonejs/keystone-5/commit/992c7e74): More resilient tests by using force clicks in Cypress to work around Cypress bugs.

- Updated dependencies [144e6e86](https://github.com/keystonejs/keystone-5/commit/144e6e86):
  - @keystone-alpha/fields@10.2.0
  - @keystone-alpha/adapter-mongoose@4.0.0
  - @keystone-alpha/keystone@10.0.0

## 1.1.6

### Patch Changes

- [42c3fbc9](https://github.com/keystonejs/keystone-5/commit/42c3fbc9): Upgrade cypress to 3.4.0
- [42c3fbc9](https://github.com/keystonejs/keystone-5/commit/42c3fbc9): Upgrade express to 4.17.1

- Updated dependencies [42c3fbc9](https://github.com/keystonejs/keystone-5/commit/42c3fbc9):
- Updated dependencies [42c3fbc9](https://github.com/keystonejs/keystone-5/commit/42c3fbc9):
  - @keystone-alpha/adapter-mongoose@3.0.0
  - @keystone-alpha/keystone@9.0.0
  - @keystone-alpha/fields@10.0.0
  - @keystone-alpha/app-admin-ui@5.1.0

## 1.1.5

- Updated dependencies [4007f5dd](https://github.com/keystonejs/keystone-5/commit/4007f5dd):
  - @keystone-alpha/adapter-mongoose@2.2.1
  - @keystone-alpha/keystone@8.0.0
  - @keystone-alpha/fields@9.1.0

## 1.1.4

- Updated dependencies [2b094b7f](https://github.com/keystonejs/keystone-5/commit/2b094b7f):
  - @keystone-alpha/app-admin-ui@5.0.4
  - @keystone-alpha/fields@9.0.0
  - @keystone-alpha/keystone@7.0.3

## 1.1.3

- Updated dependencies [b6a9f6b9](https://github.com/keystonejs/keystone-5/commit/b6a9f6b9):
  - @keystone-alpha/app-admin-ui@5.0.3
  - @keystone-alpha/keystone@7.0.2
  - @keystone-alpha/fields@8.0.0

## 1.1.2

- Updated dependencies [91fffa1e](https://github.com/keystonejs/keystone-5/commit/91fffa1e):
  - @keystone-alpha/adapter-mongoose@2.2.0
  - @keystone-alpha/keystone@7.0.0

## 1.1.1

### Patch Changes

- [b69a2276](https://github.com/keystonejs/keystone-5/commit/b69a2276):

  Removed unnecessary port parameter from keystone.prepare calls

* Updated dependencies [30c1b1e1](https://github.com/keystonejs/keystone-5/commit/30c1b1e1):
* Updated dependencies [1b4cf4e0](https://github.com/keystonejs/keystone-5/commit/1b4cf4e0):
* Updated dependencies [1b4cf4e0](https://github.com/keystonejs/keystone-5/commit/1b4cf4e0):
* Updated dependencies [1b4cf4e0](https://github.com/keystonejs/keystone-5/commit/1b4cf4e0):
  - @keystone-alpha/app-admin-ui@5.0.0
  - @keystone-alpha/keystone@6.0.0
  - @keystone-alpha/fields@7.0.0
  - @keystone-alpha/adapter-mongoose@2.1.0
  - @keystone-alpha/app-graphql@6.1.0
  - @keystone-alpha/session@2.0.0

## 1.1.0

### Minor Changes

- [dfcabe6a](https://github.com/keystonejs/keystone-5/commit/dfcabe6a):

  Specify custom servers from within the index.js file

  - Major Changes:
    - The `index.js` export for `admin` must now be exported in the `servers`
      array:
      ```diff
       module.exports = {
         keystone,
      -  admin,
      +  apps: [admin],
       }
      ```
    - The `keystone.prepare()` method (often used within a _Custom Server_
      `server.js`) no longer returns a `server`, it now returns a `middlewares`
      array:
      ```diff
      +const express = require('express');
       const port = 3000;
       keystone.prepare({ port })
      -  .then(async ({ server, keystone: keystoneApp }) => {
      +  .then(async ({ middlewares, keystone: keystoneApp }) => {
           await keystoneApp.connect();
      -    await server.start();
      +    const app = express();
      +    app.use(middlewares);
      +    app.listen(port)
         });
      ```

### Patch Changes

- [92f69b5c](https://github.com/keystonejs/keystone-5/commit/92f69b5c):

  Use KS5 built-in login routes

- [8494e4cc](https://github.com/keystonejs/keystone-5/commit/8494e4cc):

  `@keystone-alpha/app-admin-ui` no longer accepts a `keystone` paramater in its constructor. It is now automatically passed during the `keystone.prepare()` call.

* Updated dependencies [666e15f5](https://github.com/keystonejs/keystone-5/commit/666e15f5):
* Updated dependencies [b2651279](https://github.com/keystonejs/keystone-5/commit/b2651279):
  - @keystone-alpha/keystone@5.0.0
  - @keystone-alpha/app-admin-ui@4.0.0
  - @keystone-alpha/app-graphql@6.0.0

## 1.0.9

### Patch Changes

- [9b6fec3e](https://github.com/keystonejs/keystone-5/commit/9b6fec3e):

  Remove unnecessary dependency from packages

* Updated dependencies [9a0456ff](https://github.com/keystonejs/keystone-5/commit/9a0456ff):
  - @keystone-alpha/fields@6.1.1
  - @keystone-alpha/adapter-mongoose@2.0.0

## 1.0.8

### Patch Changes

- [b22d6c16](https://github.com/keystonejs/keystone-5/commit/b22d6c16):

  Remove custom server execution from the CLI.

  The Keystone CLI does not execute custom servers anymore, instead of running `keystone` to start a Keystone instance that has a custom server, run the server file directly with `node`.

  ```diff
  - "start": "keystone",
  + "start": "node server.js"
  ```

* Updated dependencies [24cd26ee](https://github.com/keystonejs/keystone-5/commit/24cd26ee):
* Updated dependencies [9dbed649](https://github.com/keystonejs/keystone-5/commit/9dbed649):
* Updated dependencies [2ef2658f](https://github.com/keystonejs/keystone-5/commit/2ef2658f):
* Updated dependencies [119448fc](https://github.com/keystonejs/keystone-5/commit/119448fc):
* Updated dependencies [ae5cf6cc](https://github.com/keystonejs/keystone-5/commit/ae5cf6cc):
* Updated dependencies [1a7b706c](https://github.com/keystonejs/keystone-5/commit/1a7b706c):
* Updated dependencies [b7a2ea9c](https://github.com/keystonejs/keystone-5/commit/b7a2ea9c):
* Updated dependencies [bd0ea21f](https://github.com/keystonejs/keystone-5/commit/bd0ea21f):
* Updated dependencies [119448fc](https://github.com/keystonejs/keystone-5/commit/119448fc):
  - @keystone-alpha/adapter-mongoose@1.0.7
  - @keystone-alpha/keystone@4.0.0
  - @keystone-alpha/admin-ui@3.2.0
  - @keystone-alpha/fields@6.0.0
  - @keystone-alpha/core@2.0.4
  - @keystone-alpha/server@5.0.0

## 1.0.7

- Updated dependencies [85b74a2c](https://github.com/keystonejs/keystone-5/commit/85b74a2c):
  - @keystone-alpha/admin-ui@3.1.0
  - @keystone-alpha/keystone@3.1.0
  - @keystone-alpha/fields@5.0.0

## 1.0.6

- [patch][b4dcf44b](https://github.com/keystonejs/keystone-5/commit/b4dcf44b):

  - Use named exports from @keystone-alpha/keystone package.

- [patch][b69fb9b7](https://github.com/keystonejs/keystone-5/commit/b69fb9b7):

  - Update dev devependencies

- [patch][656e90c2](https://github.com/keystonejs/keystone-5/commit/656e90c2):

  - Explicitly call keystone.connect() before starting the web server.

- Updated dependencies [37dcee37](https://github.com/keystonejs/keystone-5/commit/37dcee37):
- Updated dependencies [656e90c2](https://github.com/keystonejs/keystone-5/commit/656e90c2):
- Updated dependencies [b4dcf44b](https://github.com/keystonejs/keystone-5/commit/b4dcf44b):
  - @keystone-alpha/admin-ui@3.0.6
  - @keystone-alpha/keystone@3.0.0
  - @keystone-alpha/fields@4.0.0
  - @keystone-alpha/adapter-mongoose@1.0.5
  - @keystone-alpha/core@2.0.3
  - @keystone-alpha/server@4.0.0

## 1.0.5

- [patch][5ebf4c3a](https://github.com/keystonejs/keystone-5/commit/5ebf4c3a):

  - Use the new @keystone-alpha/session package

- Updated dependencies [8d385ede](https://github.com/keystonejs/keystone-5/commit/8d385ede):
- Updated dependencies [d718c016](https://github.com/keystonejs/keystone-5/commit/d718c016):
- Updated dependencies [5ebf4c3a](https://github.com/keystonejs/keystone-5/commit/5ebf4c3a):
- Updated dependencies [5ebf4c3a](https://github.com/keystonejs/keystone-5/commit/5ebf4c3a):
- Updated dependencies [52f1c47b](https://github.com/keystonejs/keystone-5/commit/52f1c47b):
  - @keystone-alpha/adapter-mongoose@1.0.4
  - @keystone-alpha/keystone@2.0.0
  - @keystone-alpha/admin-ui@3.0.4
  - @keystone-alpha/server@3.0.0
  - @keystone-alpha/session@1.0.0
  - @keystone-alpha/core@2.0.2

## 1.0.4

- [patch][5ddb2ed6](https://github.com/keystonejs/keystone-5/commit/5ddb2ed6):

  - Always display clickable links when starting a server in dev mode

## 1.0.3

- [patch][de616f7e](https://github.com/keystonejs/keystone-5/commit/de616f7e):

  - Use new authStrategy APIs

- Updated dependencies [9a9f214a](https://github.com/keystonejs/keystone-5/commit/9a9f214a):
- Updated dependencies [de616f7e](https://github.com/keystonejs/keystone-5/commit/de616f7e):
- Updated dependencies [4ed35dfd](https://github.com/keystonejs/keystone-5/commit/4ed35dfd):
  - @keystone-alpha/keystone@1.0.3
  - @keystone-alpha/admin-ui@3.0.0
  - @keystone-alpha/fields@3.0.0
  - @keystone-alpha/core@2.0.0
  - @keystone-alpha/server@2.0.0

## 1.0.2

- [patch][3a775092](https://github.com/keystonejs/keystone-5/commit/3a775092):

  - Update dependencies

- Updated dependencies [dcb93771](https://github.com/keystonejs/keystone-5/commit/dcb93771):
  - @keystone-alpha/keystone@1.0.2
  - @keystone-alpha/admin-ui@2.0.0
  - @keystone-alpha/fields@2.0.0

## 1.0.1

- [patch][1f0bc236](https://github.com/keystonejs/keystone-5/commit/1f0bc236):

  - Update the package.json author field to "The Keystone Development Team"

- [patch][c0e64c01](https://github.com/keystonejs/keystone-5/commit/c0e64c01):

  - Move system tests into api-tests package

## 1.0.0

- [major] 8b6734ae:

  - This is the first release of keystone-alpha (previously voussoir).
    All packages in the `@voussoir` namespace are now available in the `@keystone-alpha` namespace, starting at version `1.0.0`.
    To upgrade your project you must update any `@voussoir/<foo>` dependencies in `package.json` to point to `@keystone-alpha/<foo>: "^1.0.0"` and update any `require`/`import` statements in your code.

# @voussoir/cypress-project-login

## 2.0.0

- [patch] 70187044:

  - Move some dependencies into devDependencies

- [patch] 6fa810f7:

  - Rename `@voussoir/core` -> `@voussoir/keystone`. This is to free up the
    `@voussoir/core` package for a different purpose, and make the main import for
    new Keystone projects be `@voussoir/keystone`. The exports have stayed the
    same.

- [patch] 113e16d4:

  - Remove unused dependencies

- [patch] 1855d1ba:

  - Update dependencies with 'yarn audit' identified issues

- [major] 582464a8:

  - Migrate projects to new method of exporting and running keystone instances.

## 1.2.5

- [patch] 9f2ee393:

  - Add adapter parameter to setupServer() and add multiAdapterRunners()

- Updated dependencies [723371a0]:
- Updated dependencies [aca26f71]:
- Updated dependencies [53e27d75]:
- Updated dependencies [306f0b7e]:
- Updated dependencies [dc53492c]:
- Updated dependencies [6471fc4a]:
- Updated dependencies [5f8043b5]:
- Updated dependencies [48773907]:
- Updated dependencies [a3d5454d]:
- Updated dependencies [ced0edb3]:
- Updated dependencies [860c3b80]:
  - @voussoir/test-utils@1.0.0
  - @voussoir/adapter-mongoose@2.0.0
  - @voussoir/admin-ui@1.0.0
  - @voussoir/core@2.0.0
  - @voussoir/fields@3.0.0
  - @voussoir/server@1.0.0
  - @voussoir/utils@1.0.0

## 1.2.4

- [patch] e4cc314b:

  - Bump

## 1.2.3

- [patch] d22820b1:

  - Rename keystone.session to keystone.sessionManager
    - Rename keystone.session.validate to keystone.sessionManager.populateAuthedItemMiddleware
    - Rename keystone.session.create to keystone.sessionManager.startAuthedSession
    - Rename keystone.session.destroy to keystone.sessionManager.endAuthedSession

- [patch] fc1a9055:

  - Update dependencies to latest patch versions

- Updated dependencies [8145619f]:
- Updated dependencies [c83c9ed5]:
- Updated dependencies [c3ebd9e6]:
- Updated dependencies [ebae2d6f]:
- Updated dependencies [78fd9555]:
- Updated dependencies [01718870]:
- Updated dependencies [8fc0abb3]:
  - @voussoir/admin-ui@0.7.0
  - @voussoir/fields@2.0.0
  - @voussoir/ui@0.6.0
  - @voussoir/adapter-mongoose@1.0.0
  - @voussoir/test-utils@0.1.3
  - @voussoir/core@1.0.0
  - @voussoir/server@0.5.0

## 1.2.2

- Updated dependencies [45d4c379]:
- Updated dependencies [ae3b8fda]:
- Updated dependencies [9c383fe8]:
- Updated dependencies [7a24b92e]:
- Updated dependencies [589dbc02]:
- Updated dependencies [b0d19c24]:
  - @voussoir/adapter-mongoose@0.5.0
  - @voussoir/test-utils@0.1.2
  - @voussoir/core@0.7.0
  - @voussoir/fields@1.4.0
  - @voussoir/server@0.4.0
  - @voussoir/admin-ui@0.6.0
  - @voussoir/ui@0.5.0

## 1.2.1

- Updated dependencies [d94b517]:
- Updated dependencies [a3b995c]:
- Updated dependencies [1d30a329"
  ]:
  - @voussoir/adapter-mongoose@0.4.1
  - @voussoir/test-utils@0.1.1
  - @voussoir/core@0.6.0
  - @voussoir/fields@1.3.0
  - @voussoir/admin-ui@0.5.0
  - @voussoir/ui@0.4.0

## 1.2.0

- [minor] 47c7dcf6"
  :

  - Bump all packages with a minor version to set a new baseline

- Updated dependencies [d94b517]:
- Updated dependencies [a3b995c]:
  - @voussoir/adapter-mongoose@0.4.0
  - @voussoir/test-utils@0.1.0
  - @voussoir/core@0.5.0
  - @voussoir/fields@1.2.0

## 1.1.2

- Updated dependencies [d94b517]:
- Updated dependencies [a3b995c]:
- Updated dependencies [5742e25d"
  ]:
  - @voussoir/adapter-mongoose@0.3.2
  - @voussoir/test-utils@0.0.2
  - @voussoir/core@0.4.0
  - @voussoir/fields@1.1.0
  - @voussoir/admin-ui@0.3.0

## 1.1.1

- [patch] Bump all packages for Babel config fixes [d51c833](d51c833)
- [patch] Updated dependencies [445b699](445b699)
- [patch] Updated dependencies [9c75136](9c75136)
- [patch] Updated dependencies [750a83e](750a83e)
  - @voussoir/admin-ui@0.2.1
  - @voussoir/core@0.3.0
  - @voussoir/fields@1.0.0
  - @voussoir/adapter-mongoose@0.3.0
  - @voussoir/server@0.2.1
  - @voussoir/utils@0.2.0

## 1.1.0

- [minor] Add missing dependencies for which the mono-repo was hiding that they were missing [fed0cdc](fed0cdc)
