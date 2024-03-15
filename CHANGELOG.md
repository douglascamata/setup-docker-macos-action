# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [unreleased]

### Fixed

- Added workaround for Python conflict in Github Action runner images ([#34](https://github.com/douglascamata/setup-docker-macos-action/pull/34))

## [v1-alpha.12] - 2024-02-01

### Added

- Fail fast when running on arm64 macOS runners (`macos-14` public runners) ([#28](https://github.com/douglascamata/setup-docker-macos-action/pull/28)).
  - None of the arm64 processors on Apple computers support nested virtualization as of today (Feb 1st 2024).

## [v1-alpha.11] - 2024-01-05

### Added

- Allow Colima to be started with `--network-address` ([#22](https://github.com/douglascamata/setup-docker-macos-action/pull/22)).
- Add Lima and Colima versions as inputs ([#24](https://github.com/douglascamata/setup-docker-macos-action/pull/24)).

### Changed

- Allow Colima to use more resources ([#25](https://github.com/douglascamata/setup-docker-macos-action/pull/25)).

## [v1-alpha.10] - 2023-09-04

### Changed

- Improve reliability of action ([#19](https://github.com/douglascamata/setup-docker-macos-action/pull/19))
  - Colima and Lima binaries are now downloaded straight from their Github Release pages
  - By default, use `brew` only to install the Docker client and Docker Compose.
  - QEMU is now installed (using `brew`) only if it's not already present.
  - QEMU is upgraded (using `brew`) only if the input `upgrade-qemu` is set to `"true"`.
  - Detects when QEMU's installed from `brew`'s bottle 8.1.0, which has an issue in the binary's signature, and reinstalls it.

## [v1-alpha.9] - 2023-08-21

### Fixed

- Reinstall QEMU as a workaround for https://github.com/actions/runner-images/issues/8104
  even when cache is restored ([#14](https://github.com/douglascamata/setup-docker-macos-action/pull/14)).

## [v1-alpha.8] - 2023-08-21

- Initial release with a changelog. A bit late, sorry.

<!-- Links -->
[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

<!-- Versions -->
[Unreleased]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.12...HEAD
[v1-alpha.12]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.11...v1-alpha.12
[v1-alpha.11]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.10...v1-alpha.11
[v1-alpha.10]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.9...v1-alpha.10
[v1-alpha.9]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.8...v1-alpha.9
[v1-alpha.8]: https://github.com/douglascamata/setup-docker-macos-action/releases/tag/v1-alpha.8
