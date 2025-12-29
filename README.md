# Setup Docker on macOS action [![.github/workflows/test.yml](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml/badge.svg)](https://github.com/douglascamata/setup-docker-macos-action/actions/workflows/test.yml)

This action installs Docker on a macOS runner through [Colima], [Lima-VM], and [Homebrew].

[Colima]: https://github.com/abiosoft/colima
[Lima-VM]: https://github.com/lima-vm/lima
[Homebrew]: https://github.com/Homebrew/brew

I intend this action to be kept as simple as possible:

- No other OS will be supported.
- Binaries will be downloaded directly from the source when possible.

## Currently supported public runner images

- `macos-15`
- `macos-15-large`
- `macos-15-intel`

## `arm64` processors (M-series) used on `macos-15` images and beyond are unsupported

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

The version of Lima to install. This can be any valid tag from [Lima releases page](https://github.com/lima-vm/lima/tags)

### `inputs.colima` (defaults to `"latest"`)

The version of Colima to install. This can be any valid tag from [Colima releases page](https://github.com/abiosoft/colima/tags)

### `inputs.colima-network-address` (defaults to `"false"`)

Starts Colima with a reachable network address through passing `--network-address`
to the `colima start` command. Startup will be slower.

### Example

```yml
- name: Setup Docker on macOS
  id: setup-docker
  uses: douglascamata/setup-docker-macos-action@v1.0.1
  with:
    lima: v1.2.1
    colima: v0.9.1
    colima-network-address: false
```

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

### Example

```yml
- name: Log versions
  run: |
    echo "Colima version: ${{ steps.setup-docker.outputs.colima-version }}"
    echo "Docker client version: ${{ steps.setup-docker.outputs.docker-client-version }}"
    echo "Docker compose version: ${{ steps.setup-docker.outputs.docker-compose-version }}"
```

## Known Issues

### macOS 15+ Network Address Unreachable

> [!WARNING]
> On macOS 15 (Sequoia) and newer, the Colima VM's network address (e.g., `192.168.64.x`)
> is unreachable from regular user processes. This is due to Apple's **Local Network Privacy (LNP)**
> restrictions introduced in macOS 15.

#### The Problem

Apple's macOS 15 introduced Local Network Privacy policies that restrict applications from
accessing local network addresses without explicit permission. This affects:

- Accessing services running in Docker containers via the Colima VM's IP address.
- UDP traffic (required for QUIC/HTTP3) — `localhost` port forwarding only supports TCP.
- Any workflow that relies on direct network communication with the VM through the Colima VM IP.

This is **not a bug in this action, Colima, or Lima** — it's a platform-level restriction
from Apple that currently has no complete workaround.

#### Upstream Tracking

- **GitHub Actions issue**: [actions/runner-images#10924](https://github.com/actions/runner-images/issues/10924)
- **This action's issue**: [#56](https://github.com/douglascamata/setup-docker-macos-action/issues/56)
- **Colima issue**: [abiosoft/colima#1448](https://github.com/abiosoft/colima/issues/1448)

GitHub has filed feedback with Apple (`FB16213134`) but there is currently no resolution.
We are blocked by both GitHub Actions and Apple on a proper fix.

#### Workarounds

| Workaround | Pros | Cons |
|------------|------|------|
| **Use `localhost` port forwarding** | Works for TCP, no special setup | No UDP support (breaks QUIC/HTTP3) |
| Run clients as `root` user | Bypasses LNP for VM IP access | Requires elevated privileges for network access |

##### Using `root` for VM network access

Root processes are exempt from Apple's LNP restrictions. If you need to access the Colima
VM's network address directly, run your network client as `root` or with `sudo`:

```yml
- name: Setup Docker with network address
  uses: douglascamata/setup-docker-macos-action@v1
  with:
    colima-network-address: true

- name: Get Colima VM IP
  run: |
    COLIMA_IP=$(colima list | awk '/default/ {print $NF}')
    echo "COLIMA_IP=$COLIMA_IP" >> $GITHUB_ENV

- name: Access service via VM IP (requires sudo)
  run: |
    # Regular curl will fail due to LNP restrictions
    # curl http://$COLIMA_IP:8080  # ❌ Blocked by macOS 15 LNP

    # Use sudo to bypass LNP restrictions
    sudo curl http://$COLIMA_IP:8080  # ✅ Works
```

> [!NOTE]
> Running Colima itself as root (`sudo colima start`) is **not supported** by Lima/Colima
> and will cause issues. Only run the network client (curl, wget, etc.) as root.
