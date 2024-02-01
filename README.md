# Setup Docker on macOS action [![.github/workflows/test.yml](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml/badge.svg)](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml)

This action installs Docker on a macOS runner through [Colima], [Lima-VM], and [Homebrew].

[Colima]: https://github.com/abiosoft/colima
[Lima-VM]: https://github.com/lima-vm/lima
[Homebrew]: https://github.com/Homebrew/brew

I intend this action to be kept as simple as possible:

- No other OS will be supported.
- Binaries will be downloaded directly from the source when possible.

# Currently supported public runner images

- `macos-12`
- `macos-13`

# ARM64 processors (M1, M2, M3 series) used on `macos-14` images are unsupported!

Yes, exactly what you just read. These processors do not support nested
virtualization. This means Colima can't start the VM to run Docker.

For the M1 processor there is no hope. It lacks the hardware support for this.

The M2 and M3 processors have such hardware support, but no software support
from Apple's Hypervisor framework (so no hopes for QEMU) or Virtualization
framework (alternative to QEMU).

I'm sorry, but there's nothing I can do about it. All we can do is wait. If I
miss the announcement of nested virtualization support, please open an issue.

## Features

- Safety check to ensure the action is running in macOS.
- As simple and lightweight (downloads binaries directly when possible).

## Inputs

## `inputs.upgrade-qemu` (defaults to `"false"`)

The action, by default, will not try to upgrade QEMU if it's already installed.
The reason is that installing QEMU takes a considerable amount of time.

If this is set to `"true"`, the action will attempt an upgrade of QEMU to the
latest version available in Homebrew.

## `inputs.lima` (defaults to `"latest"`)

The version of Lima to install. This can be any valid version from [Lima releases page](https://github.com/lima-vm/lima/releases)

## `inputs.colima` (defaults to `"latest"`)

The version of Colima to install. This can be any valid version from [Colima releases page](https://github.com/abiosoft/colima/releases)

## `inputs.colima-network-address` (defaults to `"false"`)

Starts Colima with a reachable network address through passing `--network-address`
to the `colima start` command. Startup will be slower.

## Outputs

## `colima-version`

The version of Colima that was installed.

## `docker-client-version`

The version of the Docker client that was installed.

## `docker-compose-version`

The version of Docker Compose that was installed.
