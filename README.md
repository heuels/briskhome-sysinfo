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
  * [x] Send a valid JSON object with every event.
  * [x] Instead of sending 'critical' events, add a 'critical' section to event.
  * [x] Add free/total disk space to results.
  * [ ] Add low disk space event.
  * [ ] Add low disk space configuration option.
  * [x] Add network stats support.
  * [ ] Add unit tests.
  * [ ] Begin using @briskhome/helper library for type checking.

### v1.x.x
  * [ ] Add comments to every function.
  * [ ] Refactor all functions.
    * [ ] Refactor Sysmon.prototype.config.
    * [x] Refactor Sysmon.prototype.start.
    * [ ] Refactor Sysmon.prototype.reset.
    * [ ] Refactor Sysmon.prototype.stop.
    * [x] Refactor Sysmon.prototype.destroy.
    * [x] Refactor Sysmon.prototype._isRunning.
    * [x] Refactor Sysmon.prototype._isStopped.
