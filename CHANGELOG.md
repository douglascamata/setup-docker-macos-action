# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [Unreleased]

## [v1-alpha.10] - 2023-09-04

### Changed

- Improve reliability of action ([#19](https://github.com/douglascamata/setup-docker-macos-action/pull/19))
  - Colima and Lima binaries are now downloaded straight from their Github Release pages
  - By default, use `brew` only to install the Docker client and Docker Compose.
  - QEMU is now installed (using `brew`) only if it's not already present.
  - QEMU is upgraded (using `brew`) only if the input `upgrade-qemu` is set to `"true"`.

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
[unreleased]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.9...HEAD
[v1-alpha.10]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.9...v1-alpha.10
[v1-alpha.9]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.8...v1-alpha.9
[v1-alpha.8]: https://github.com/douglascamata/setup-docker-macos-action/releases/tag/v1-alpha.8
