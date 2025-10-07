# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [Unreleased]

## [v1.0.1] - 2025-10-07

### Added

- Support for macOS 15 on Intel CPUs ([#49](https://github.com/douglascamata/setup-docker-macos-action/pull/49)).

### Removed

- Python conflicts workaround that was previously required for QEMU dependency. Since this action no longer installs QEMU as a dependency, the workaround is no longer needed ([#48](https://github.com/douglascamata/setup-docker-macos-action/pull/48)).

## [v1.0.0] - 2025-04-16

This release is just a retag of `v1-alpha.16` as `v1.0.0`.

## [v1-alpha.16] - 2025-01-16

### Fixed

- Run `brew update` without `--preinstall`, as it was removed from Homebrew since a while and 4.4.16 started rejecting it. ([#45](https://github.com/douglascamata/setup-docker-macos-action/pull/45))

## [v1-alpha.15] - 2024-11-27

### Added

- Support for native virtualization provided by macOS Virtualization framework. In detail, now Lima VMs are configured to use `vz` as the VM type and `virtiofs` for mounts. This change leads to significant stability and performance improvements ([#42](https://github.com/douglascamata/setup-docker-macos-action/pull/42)).

- Support for passing custom parameters to the `colima start` command through the `colima-additional-options` input field. Please use this field carefully, as a wrong, obsolete, or unsupported set of options may break Colima startup ([#43](https://github.com/douglascamata/setup-docker-macos-action/pull/43)).

### Removed

- Support for QEMU virtualization, which has historically been fragile and hard to maintain. The related `upgrade-qemu` config flag has also been removed ([#42](https://github.com/douglascamata/setup-docker-macos-action/pull/42)).

## [v1-alpha.14] - 2024-09-19

### Fixed

- Pin the version of QEMU to 9.0.2 to avoid an issue with version 9.1.0 that prevents the Colima VM from starting ([#40](https://github.com/douglascamata/setup-docker-macos-action/pull/40)).

### Removed

- Support for `macos-13` action runners has been removed as even with QEMU 9.0.2 the Colima VM fails to start. This might be readded in the future if the issue is fixed ([#40](https://github.com/douglascamata/setup-docker-macos-action/pull/40)).

## [v1-alpha.13] - 2024-03-18

### Fixed

- Added workaround for Python conflict in Github Action runner images ([#34](https://github.com/douglascamata/setup-docker-macos-action/pull/34)).

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

- Reinstall QEMU as a workaround for <https://github.com/actions/runner-images/issues/8104>
  even when cache is restored ([#14](https://github.com/douglascamata/setup-docker-macos-action/pull/14)).

## [v1-alpha.8] - 2023-08-21

- Initial release with a changelog. A bit late, sorry.

<!-- Links -->
[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

<!-- Versions -->
[Unreleased]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1.0.1...HEAD
[v1.0.1]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.16...v1.0.0
[v1-alpha.16]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.15...v1-alpha.16
[v1-alpha.15]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.14...v1-alpha.15
[v1-alpha.14]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.13...v1-alpha.14
[v1-alpha.13]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.12...v1-alpha.13
[v1-alpha.12]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.11...v1-alpha.12
[v1-alpha.11]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.10...v1-alpha.11
[v1-alpha.10]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.9...v1-alpha.10
[v1-alpha.9]: https://github.com/douglascamata/setup-docker-macos-action/compare/v1-alpha.8...v1-alpha.9
[v1-alpha.8]: https://github.com/douglascamata/setup-docker-macos-action/releases/tag/v1-alpha.8
