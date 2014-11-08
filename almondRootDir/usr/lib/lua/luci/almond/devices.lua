module("luci.almond.devices", package.seeall)

require "luci.json"
require "luci.almond.powermeterswitch"


local function printy(...)
  printResult = ""
  for i,v in ipairs(arg) do
    printResult = printResult .. tostring(v) .. "\t"
  end
  os.execute("echo " ..printResult .. " > /dev/pts/0")
end

local function printytable(t)
  for k,v in pairs(t) do
    printy(k,v)
  end
end

local function Driver(execDir)
  
----------  private fields & methods ---------- 
  local setDeviceExecDir = execDir

  local function stringify(t, s)
    return table.concat(t,s)
  end

  local function stringifyArgs(args)
    argTable = {}
    for key, value in pairs(args) do
        keyValuePair = key .. "=" .. tostring(value)
        table.insert(argTable, keyValuePair)
    end
    return stringify(argTable, ' ')
  end

  local function execute(command)
    local handle = io.popen(command)
    local result = handle:read("*a")
    handle:close()
    return result
  end

  local function sleep(seconds)
    os.execute("sleep " .. tonumber(seconds))
  end


---------- public fields & methods ---------- 
  local self = {
    test = 1
  }

  function self.osSleep(milliseconds)
    seconds = milliseconds/1000
    sleep(seconds)
  end

  function self.getSet(args)
    argString = stringifyArgs(args)
    return execute(setDeviceExecDir .. " " .. argString)
  end


  -- return the instance
  return self
end

function Devices()
  
----------  private fields & methods ---------- 
  local driver = Driver("/www/setdevice")
  
  local function stringsDiffer(str1, str2)
    match1 = string.match(str1, str2)
    match2 = string.match(str2, str1)
    if match1 and match2 then
      return false
    else
      return true
    end
  end

  local function driverGetSet(args)
    return driver.getSet(args)
  end

  local function fetchDevices()
    return driverGetSet({
      cmd = 'list'
    })
  end

  local function setDevice(dev, idx, val)
    return driverGetSet({
      cmd = 'set',
      dev = dev,
      idx = idx,
      val = val
    })
  end

  local function setProp(dev, name, location)
    return driverGetSet({
      cmd = 'set',
      dev = dev,
      name = "\"" .. name .. "\"",
      location = "\"" .. location .. "\""
    })
  end

  local function pollDevices(oldString)
    -- timeout in seconds
    timeout = 300
    while timeout > 0 do
      newData = fetchDevices()
      oldData = oldString
      if stringsDiffer(newData, oldData) then
        printy('changed!')
        coroutine.yield(newData)
      else
        printy('------')
        driver.osSleep(500)
      end
      timeout = timeout - .5
      printy(timeout)
    end
  end

  local function jsonToLua(jsonString)
    if jsonString ~= '' then
      return luci.json.decode(jsonString)
    else
      return luci.json.decode('{}')
    end
  end

  local function luaToJSON(luaTable)
    return luci.json.encode(luaTable)
  end

  local function cleanValue(string)
    value = tonumber(string)
    if  (value == nil) then
  -- not a number, leave as a string --
      return string
    else
  -- is a number, return that number--
      return value
    end
  end

  local function buildDeviceValueArray(deviceType, valueTable)
    valueArray = {}
    for k,v in pairs(valueTable) do
      valueObj = {
        index = tonumber(v.index),
        name = v.name,
        value =  cleanValue(v.value);
      }
      table.insert(valueArray, valueObj)
    end
    if (deviceType == '22') then
      PMS = luci.almond.powermeterswitch.PowerMeterSwitch(valueArray)
      return PMS.getValueArray()
    else
      return valueArray
    end
  end

  local function cleanDevices(messyDevices)
-- Loop over all devices and make an array --
    devices = {}
    for k,v in pairs(messyDevices) do
      deviceObj = v
  -- Loop over all device attributes and make dict --
      device = {}
      for k,v in pairs(deviceObj) do
        if(k == 'DeviceValues')then
    -- Simplifying down the values given by sensors --
          value = buildDeviceValueArray(deviceObj['DeviceType'], v)
    -- Simplifying down the values given by sensors --
        else
          value = v
        end
        device[k] = value
      end
  -- Loop over all device attributes and make dict --
      table.insert(devices, device)
    end
-- Loop over all devices and make an array --
    return devices
  end

  local jsonString = fetchDevices()
  local messyDevices = jsonToLua(jsonString)
  local deviceData = cleanDevices(messyDevices)
  local deviceListener = coroutine.create(pollDevices)
  
---------- public fields & methods ---------- 
  local self = {
    test = 1
  }

  function self.get()
    return luaToJSON(devices)
  end

  function self.set(dev, idx, val)
    return setDevice(dev, idx, val)
  end

  function self.propSet(dev, name, location)
    return setProp(dev, name, location)
  end

  function self.poll()
    okay, jsonString = coroutine.resume(deviceListener, jsonString)
    messyDevices = jsonToLua(jsonString)
    devices = cleanDevices(messyDevices)
    return luaToJSON(devices)
  end

  -- return the instance
  return self
end
