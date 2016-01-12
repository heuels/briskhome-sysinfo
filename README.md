# briskhome-sysmon
A system monitor module for Briskhome - private house monitoring and automation service. Version 0.2.0 is considered semi-stable, although lacking few necessary functions. Those are to be added in future prerelease versions.

Prior to v0.2.0 the idea was to have a self-contained module without any external dependencies. Since then it is not true, some external packages are already used in System monitor.

## Roadmap to v1.0.0
### v0.1.4
  * [x] Begin using semver.
  * [x] Add validators for all possible configuration options.
  * [x] Add unit tests for all possible configuration options.
  * [x] Fix issue #1

### v0.3.x
  * [ ] Send a valid JSON object with every event.
  * [ ] Instead of sending 'critical' events, add a 'critical' section to event.
  * [ ] Add free/total disk space to results.
  * [ ] Add low disk space event.
  * [ ] Add low disk space configuration option.
  * [ ] Add network stats support.
  * [ ] Add unit tests.

### v1.x.x
  * [ ] Add comments to every function.
  * [ ] Refactor all functions.
    * [ ] Refactor Sysmon.prototype.config.
    * [ ] Refactor Sysmon.prototype.start.
    * [ ] Refactor Sysmon.prototype.reset.
    * [ ] Refactor Sysmon.prototype.stop.
    * [ ] Refactor Sysmon.prototype.destroy.
    * [ ] Refactor Sysmon.prototype._isRunning.
    * [ ] Refactor Sysmon.prototype._isStopped.
