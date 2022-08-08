# Setup Docker on macOS action

This action installs Docker on a macOS runner through [Colima], [Lima-VM], and [Homebrew].

[Colima]: https://github.com/abiosoft/colima
[Lima-VM]: https://github.com/lima-vm/lima
[Homebrew]: https://github.com/Homebrew/brew

I intend this action to be kept as simple as possible:

- No other OS will be supported.
- No other installation method for Colima will be supported (means you will always get what Homebrew gives you).

## Features

- Safety check to ensure the action is running in macOS.
- Caches big Homebrew packages to save some CI minutes.

## Outputs

## `colima-version`

The version of Colima that was installed.

## `docker-client-version`

The version of the Docker client that was installed.