# Setup Docker on macOS action [![.github/workflows/test.yml](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml/badge.svg)](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml)

This action installs Docker on a macOS runner through [Colima], [Lima-VM], and [Homebrew].

[Colima]: https://github.com/abiosoft/colima
[Lima-VM]: https://github.com/lima-vm/lima
[Homebrew]: https://github.com/Homebrew/brew

I intend this action to be kept as simple as possible:

- No other OS will be supported.
- Binaries will be downloaded directly from the source when possible.

# M1, M2, M3 series are unsupported!

Yes, exactly what you just read. These processors do not support nested
virtualization. This means Colima can't start the VM to run Docker.

I'm sorry, but there's nothing I can do about it. All we can do is wait until
an M-series processor supports it and Github adopts such processors for action
runners.

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
