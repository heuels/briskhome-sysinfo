# briskhome-sysmon
A system monitor module for Briskhome - private house monitoring and automation service.

## Roadmap to v1.0.0
### v0.1.4
  * [x] Begin using semver.
  * [x] Add validators for all possible configuration options.
  * [x] Add unit tests for all possible configuration options.
  * [x] Fix issue #1

### v0.2.x
  * [ ] Add comments to every function.
  * [ ] Refactor all functions.
    * [ ] Refactor Sysmon.prototype.config.
    * [ ] Refactor Sysmon.prototype.start.
    * [ ] Refactor Sysmon.prototype.reset.
    * [ ] Refactor Sysmon.prototype.stop.
    * [ ] Refactor Sysmon.prototype.destroy.
    * [ ] Refactor Sysmon.prototype._isRunning.
    * [ ] Refactor Sysmon.prototype._isStopped.

### v0.3.x
  * [ ] Send a valid JSON object with every event.
  * [ ] Add free/total disk space to results.
  * [ ] Add low disk space event.
  * [ ] Add low disk space configuration option.
  * [ ] Add network stats support.
  * [ ] Add unit tests.
