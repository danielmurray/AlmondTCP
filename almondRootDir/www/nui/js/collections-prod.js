window.DEBUG = false;
window.Colors = window.Luci.loadJson("colorDict");

// Debug collection instantiation
window.Devices = new DeviceCollection();
window.Rules = new RuleCollection();
window.TriggerGroups = new TriggerGroupCollection();
window.Triggers = new TriggerCollection();
window.Results = new ResultCollection()

