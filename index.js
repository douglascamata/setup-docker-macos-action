const core = require("@actions/core");
const exec = require("@actions/exec");

async function installMacOS() {
  await exec.exec("brew", ["install", "docker", "colima"]);
}

async function run() {
  try {
    await installMacOS();
    await exec.exec("colima", ["start"]);

    dockerVersion = (
      await exec.getExecOutput("docker", ["version"])
    ).stdout.trim();
    core.setOutput("docker-client-version", dockerVersion);

    colimaVersion = (
      await exec.getExecOutput("colima", ["version"])
    ).stdout.trim();
    core.setOutput("colima-version", colimaVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
