# Setup Docker on macOS action [![.github/workflows/test.yml](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml/badge.svg)](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml)

This action installs Docker on a macOS runner through [Colima], [Lima-VM], and [Homebrew].

[Colima]: https://github.com/abiosoft/colima
[Lima-VM]: https://github.com/lima-vm/lima
[Homebrew]: https://github.com/Homebrew/brew

I intend this action to be kept as simple as possible:

- No other OS will be supported.
- Binaries will be downloaded directly from the source when possible.

## Currently supported public runner images

- `macos-13`

## `arm64` processors (M-series) used on `macos-14` images and beyond are unsupported

> [!WARNING]
> Apple added support for nested virtualization starting on M3 processors
> on macOS 15 (see [Apple Developer docs][apple-developer-docs-nested-virtualization]).
> This action will be updated to support it as soon as Github starts to update
> the runners accordingly IF they enable nested virtualization.

[apple-developer-docs-nested-virtualization]: https://developer.apple.com/documentation/virtualization/vzgenericplatformconfiguration/4360553-isnestedvirtualizationsupported

Yes, exactly what you just read. These processors do not support nested
virtualization. This means Colima can't start the VM to run Docker.

For the M1 processor there is no hope. It lacks the hardware support for this.

The M2 and M3 processors have such hardware support, but no software support
from Apple's Hypervisor framework (so no hopes for QEMU) or Virtualization
framework (alternative to QEMU) before macOS 15.

I'm sorry, but there's nothing I can do about it. All we can do is wait. If I
miss the announcement of nested virtualization support, please open an issue.

## Features

- Safety check to ensure the action is running in macOS.
- As simple and lightweight (downloads binaries directly when possible).

## Inputs

### `inputs.lima` (defaults to `"latest"`)

The version of Lima to install. This can be any valid version from [Lima releases page](https://github.com/lima-vm/lima/releases)

### `inputs.colima` (defaults to `"latest"`)

The version of Colima to install. This can be any valid version from [Colima releases page](https://github.com/abiosoft/colima/releases)

### `inputs.colima-network-address` (defaults to `"false"`)

Starts Colima with a reachable network address through passing `--network-address`
to the `colima start` command. Startup will be slower.

### `inputs.colima-additional-options`

Adds custom parameters to the `colima start` command. Please use this field carefully,
as a wrong, obsolete, or unsupported set of parameters may break Colima startup.

## Outputs

### `colima-version`

The version of Colima that was installed.

### `docker-client-version`

The version of the Docker client that was installed.

### `docker-compose-version`

The version of Docker Compose that was installed.
