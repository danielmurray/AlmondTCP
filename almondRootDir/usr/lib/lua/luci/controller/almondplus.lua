module("luci.controller.almondplus", package.seeall)

require "luci.almond.devices"
require "luci.almond.users"
local nixio = require "nixio", require "nixio.util" 

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

function Almond()
  
----------  private fields & methods ---------- 
  local devices = luci.almond.devices.Devices()
  local users = luci.almond.users.Users()

  local function deviceGet()
    return devices.get()
  end

  local function devicePropSet(dev, name, location)
    return devices.propSet(dev, name, location)
  end

  local function deviceSet(dev, idx, val)
    return devices.set(dev, idx, val)
  end

  local function pollLong()
    return devices.poll()
  end

  local function userGet()
    return users.get()
  end

  local function userSet(userId, userString)
    return users.set(userId, userString)
  end




---------- public fields & methods ---------- 
  local self = {
    test = tostring(os.time())
  }

  function self.devices(params)
    if (params ~= nil) then
      cmd = params['cmd']
      if (cmd == 'set') then
        dev = params['dev']
        idx = params['idx']
        val = params['val']
        name = params['name']
        location = params['location']
        if(name ~= nil) then
          return devicePropSet(dev, name, location)
        else 
          return deviceSet(dev, idx, val)
        end
      end
      if (cmd == 'setName') then
        dev = params['dev']
        idx = params['idx']
        val = params['val']
        location = params['val']
        return deviceSet(dev, idx, val)
      end
      if (cmd == 'setName') then
        dev = params['dev']
        idx = params['idx']
        val = params['val']
        location = params['val']
        return deviceSet(dev, idx, val)
      end
    end
    return deviceGet()
  end

  function self.longPoll()
    return pollLong()
  end

  function self.users(params)
    if (params ~= nil) then
      cmd = params['cmd']
      if (cmd == 'set') then
        id = params['id']
        val = params['val']
        return userSet(id, val)
      end
    end
    return userGet()
  end

  -- return the instance
  return self
end

local almond = Almond()

function devices(params)
  luci.http.prepare_content("text/plain")
  local result = 	almond.devices(params)
  luci.http.write(result)
end

function longPoll(params)
  luci.http.prepare_content("text/plain")
  local result =  almond.longPoll()
  luci.http.write(result)
end

function users(params)
  luci.http.prepare_content("text/plain")
  local result =  almond.users(params)
  luci.http.write(result)
end

function index()
	local params = luci.http.formvalue(nil)
  entry({"admin","users"}, call("users", params), "Users", 60)
  entry({"admin","devices"}, call("devices", params), "Devices", 60)
  entry({"admin","devices","longpoll"}, call("longPoll", params), "LongPoll", 60)
end